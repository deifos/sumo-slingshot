import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react"
import type { GamePhase, Vec2 } from "./types"
import {
  PLAYER_MASS,
  PLAYER_SIZE_RATIO,
  RING_RADIUS_RATIO,
  FLASH_DURATION_MS,
  FLASH_COOLDOWN_MS,
  COLOR_PLAYER,
  COLOR_OPPONENT,
  COLOR_HIT,
} from "./constants"
import { createBody, isRingOut, launchBody, resolveCollision, stepBody } from "./physics"
import { drawArena, drawSlingshot } from "./renderer"
import { useGameLoop } from "./useGameLoop"
import { useHandTracking, type PinchState } from "./useHandTracking"
import { Bot } from "./Bot"

export interface ArenaHandle {
  resetPositions: () => void
}

interface ArenaProps {
  phase: GamePhase
  onRingOut: (who: "player" | "opponent") => void
  onCollision?: () => void
}

export const Arena = forwardRef<ArenaHandle, ArenaProps>(function Arena(
  { phase, onRingOut, onCollision },
  ref,
) {
  // Refs for DOM elements
  const containerRef = useRef<HTMLDivElement>(null)
  const arenaCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const opponentRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Physics bodies
  const playerBody = useRef(createBody(0, 0, 0, PLAYER_MASS))
  const opponentBody = useRef(createBody(0, 0, 0, PLAYER_MASS))

  // Arena dimensions
  const arenaW = useRef(0)
  const arenaH = useRef(0)
  const playerSize = useRef(0)

  // Game state refs (for game loop access without stale closures)
  const phaseRef = useRef(phase)
  const onRingOutRef = useRef(onRingOut)
  const onCollisionRef = useRef(onCollision)
  useEffect(() => {
    phaseRef.current = phase
    onRingOutRef.current = onRingOut
    onCollisionRef.current = onCollision
  })
  const ringOutFired = useRef(false)

  // Pinch state from hand tracking
  const pinchRef = useHandTracking(videoRef)

  // Mouse/touch fallback
  const mousePinch = useRef<PinchState>({ active: false, pos: null })

  // Collision flash
  const lastFlashTime = useRef(0)
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Bot AI
  const bot = useRef(new Bot())

  // Track pinch release for launching
  const wasPinching = useRef(false)

  // Get the effective pinch (hand tracking takes priority over mouse)
  function getActivePinch(): PinchState {
    if (pinchRef.current.active || pinchRef.current.pos) return pinchRef.current
    return mousePinch.current
  }

  // Initialize arena dimensions
  const measureArena = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight
    arenaW.current = w
    arenaH.current = h
    playerSize.current = w * PLAYER_SIZE_RATIO

    // Set canvas sizes
    if (arenaCanvasRef.current) {
      arenaCanvasRef.current.width = w
      arenaCanvasRef.current.height = h
    }

    // Set overlay canvas size (matches player box)
    const ps = playerSize.current
    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.width = ps
      overlayCanvasRef.current.height = ps
    }

    // Update body sizes
    playerBody.current.size = ps
    opponentBody.current.size = ps
  }, [])

  // Reset positions to starting spots
  const resetPositions = useCallback(() => {
    const w = arenaW.current
    const h = arenaH.current
    const ps = playerSize.current

    playerBody.current.pos = { x: w * 0.3, y: h / 2 }
    playerBody.current.vel = { x: 0, y: 0 }
    playerBody.current.size = ps

    opponentBody.current.pos = { x: w * 0.7, y: h / 2 }
    opponentBody.current.vel = { x: 0, y: 0 }
    opponentBody.current.size = ps

    ringOutFired.current = false
    bot.current.reset()
  }, [])

  useImperativeHandle(ref, () => ({ resetPositions }), [resetPositions])

  // Measure on mount and resize
  useEffect(() => {
    measureArena()
    resetPositions()

    const observer = new ResizeObserver(() => {
      measureArena()
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [measureArena, resetPositions])

  // Collision flash on both boxes
  const flashTimeoutOpp = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const triggerFlash = useCallback(() => {
    const now = performance.now()
    if (now - lastFlashTime.current < FLASH_COOLDOWN_MS) return
    lastFlashTime.current = now

    // Flash player box
    const pEl = playerRef.current
    if (pEl) {
      pEl.style.borderColor = COLOR_HIT
      clearTimeout(flashTimeout.current)
      flashTimeout.current = setTimeout(() => {
        pEl.style.borderColor = COLOR_PLAYER
      }, FLASH_DURATION_MS)
    }

    // Flash opponent box
    const oEl = opponentRef.current
    if (oEl) {
      oEl.style.borderColor = COLOR_HIT
      clearTimeout(flashTimeoutOpp.current)
      flashTimeoutOpp.current = setTimeout(() => {
        oEl.style.borderColor = COLOR_OPPONENT
      }, FLASH_DURATION_MS)
    }

    onCollisionRef.current?.()
  }, [])

  // Main game loop
  useGameLoop(() => {
    if (phaseRef.current !== "playing") {
      // Still render arena ring when not playing
      const ctx = arenaCanvasRef.current?.getContext("2d")
      if (ctx) {
        const w = arenaW.current
        const h = arenaH.current
        drawArena(ctx, w, h, w * RING_RADIUS_RATIO)
      }
      // Update positions visually
      updateDom(playerRef.current, playerBody.current.pos, playerSize.current)
      updateDom(opponentRef.current, opponentBody.current.pos, playerSize.current)
      return
    }

    const w = arenaW.current
    const h = arenaH.current
    if (w === 0 || h === 0) return

    const ringRadius = w * RING_RADIUS_RATIO
    const activePinch = getActivePinch()
    const isPinching = activePinch.active

    // Detect pinch release -> launch
    if (wasPinching.current && !isPinching && activePinch.pos) {
      launchBody(playerBody.current, activePinch.pos, w, h)
      // Clear the stored position after launch
      pinchRef.current = { active: false, pos: null }
      mousePinch.current = { active: false, pos: null }
    }
    wasPinching.current = isPinching

    // Step physics (player frozen while pinching)
    if (!isPinching) {
      stepBody(playerBody.current)
    }
    stepBody(opponentBody.current)

    // Bot AI
    bot.current.update(opponentBody.current, playerBody.current, w, h)

    // Collisions — always active (while pinching, player acts as immovable wall)
    if (isPinching) {
      // Temporarily give player huge mass so it doesn't move on collision
      const savedMass = playerBody.current.mass
      playerBody.current.mass = 9999
      if (resolveCollision(playerBody.current, opponentBody.current)) {
        triggerFlash()
      }
      playerBody.current.mass = savedMass
      // Reset any velocity the collision gave the "pinched" player
      playerBody.current.vel.x = 0
      playerBody.current.vel.y = 0
    } else {
      if (resolveCollision(playerBody.current, opponentBody.current)) {
        triggerFlash()
      }
    }

    // Ring-out detection
    if (!ringOutFired.current) {
      const cx = w / 2
      const cy = h / 2
      if (isRingOut(playerBody.current, cx, cy, ringRadius)) {
        ringOutFired.current = true
        onRingOutRef.current("player")
      } else if (isRingOut(opponentBody.current, cx, cy, ringRadius)) {
        ringOutFired.current = true
        onRingOutRef.current("opponent")
      }
    }

    // Update DOM positions
    updateDom(playerRef.current, playerBody.current.pos, playerSize.current)
    updateDom(opponentRef.current, opponentBody.current.pos, playerSize.current)

    // Draw arena canvas
    const arenaCtx = arenaCanvasRef.current?.getContext("2d")
    if (arenaCtx) {
      const cx = w / 2
      const cy = h / 2
      const pDist = Math.hypot(
        playerBody.current.pos.x - cx,
        playerBody.current.pos.y - cy,
      )
      const oDist = Math.hypot(
        opponentBody.current.pos.x - cx,
        opponentBody.current.pos.y - cy,
      )
      drawArena(arenaCtx, w, h, ringRadius, pDist, oDist)
    }

    // Draw slingshot overlay (hand tracking only — mouse has no mirrored overlay)
    const overlayCtx = overlayCanvasRef.current?.getContext("2d")
    if (overlayCtx) {
      const ps = playerSize.current
      const handActive = pinchRef.current.active
      drawSlingshot(overlayCtx, ps, ps, handActive ? pinchRef.current.pos : null)
    }
  })

  // Mouse/touch handlers for fallback slingshot
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (phaseRef.current !== "playing") return
      // Only respond to primary button
      if (e.button !== 0) return

      const box = playerRef.current
      if (!box) return

      const rect = box.getBoundingClientRect()
      const x = clamp01((e.clientX - rect.left) / rect.width)
      const y = clamp01((e.clientY - rect.top) / rect.height)

      // Invert Y so mouse is direct-aim (click up = launch up)
      mousePinch.current = { active: true, pos: { x, y: 1 - y } }
      containerRef.current?.setPointerCapture(e.pointerId)
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!mousePinch.current.active) return

      const box = playerRef.current
      if (!box) return

      const rect = box.getBoundingClientRect()
      const x = clamp01((e.clientX - rect.left) / rect.width)
      const y = clamp01((e.clientY - rect.top) / rect.height)

      mousePinch.current = { active: true, pos: { x, y: 1 - y } }
    },
    [],
  )

  const handlePointerUp = useCallback(() => {
    if (mousePinch.current.active) {
      mousePinch.current = { active: false, pos: mousePinch.current.pos }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="arena-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Arena ring canvas */}
      <canvas
        ref={arenaCanvasRef}
        className="pointer-events-none absolute inset-0"
      />

      {/* Player box */}
      <div
        ref={playerRef}
        className="player-box"
        style={{ borderColor: COLOR_PLAYER }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full scale-x-[-1] object-cover"
        />
        <canvas
          ref={overlayCanvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <div className="no-cam">camera loading...</div>
      </div>

      {/* Opponent (bot) box */}
      <div
        ref={opponentRef}
        className="player-box"
        style={{ borderColor: COLOR_OPPONENT }}
      >
        <div className="flex h-full w-full items-center justify-center bg-[#01ffff]/10">
          <span className="font-game text-lg tracking-widest text-[#01ffff] opacity-60">
            BOT
          </span>
        </div>
      </div>
    </div>
  )
})

function updateDom(
  el: HTMLDivElement | null,
  pos: Vec2,
  size: number,
): void {
  if (!el) return
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.left = `${pos.x}px`
  el.style.top = `${pos.y}px`
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}
