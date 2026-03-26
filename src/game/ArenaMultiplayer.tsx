import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react"
import type { GamePhase, Vec2 } from "./types"
import type { MultiplayerState } from "./multiplayer"
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
import { createBody, isRingOut, launchBody, resolveCollisionOneSided, stepBody } from "./physics"
import { drawArena, drawSlingshot } from "./renderer"
import { useGameLoop } from "./useGameLoop"
import { useHandTracking, type PinchState } from "./useHandTracking"

export interface ArenaMultiplayerHandle {
  resetPositions: () => void
}

interface Props {
  phase: GamePhase
  playerNumber: 1 | 2
  remoteStream: MediaStream | null
  onRingOut: (who: "player" | "opponent") => void
  onStateUpdate: (state: MultiplayerState) => void
  opponentState: React.MutableRefObject<MultiplayerState | null>
  onCameraReady?: () => void
}

export const ArenaMultiplayer = forwardRef<ArenaMultiplayerHandle, Props>(
  function ArenaMultiplayer(
    { phase, playerNumber, remoteStream, onRingOut, onStateUpdate, opponentState, onCameraReady },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const arenaCanvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const playerRef = useRef<HTMLDivElement>(null)
    const opponentRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)

    const playerBody = useRef(createBody(0, 0, 0, PLAYER_MASS))
    const opponentBody = useRef(createBody(0, 0, 0, PLAYER_MASS))

    const arenaW = useRef(0)
    const arenaH = useRef(0)
    const playerSize = useRef(0)

    const phaseRef = useRef(phase)
    const onRingOutRef = useRef(onRingOut)
    const onStateUpdateRef = useRef(onStateUpdate)
    useEffect(() => {
      phaseRef.current = phase
      onRingOutRef.current = onRingOut
      onStateUpdateRef.current = onStateUpdate
    })
    const ringOutFired = useRef(false)

    const pinchRef = useHandTracking(videoRef, onCameraReady)
    const mousePinch = useRef<PinchState>({ active: false, pos: null })

    const lastFlashTime = useRef(0)
    const flashTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const flashTimeoutOpp = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const wasPinching = useRef(false)
    const releaseFrames = useRef(0)

    // Attach remote stream to video element and start playback
    useEffect(() => {
      const video = remoteVideoRef.current
      if (!video || !remoteStream) return
      video.srcObject = remoteStream
      video.play().catch(() => {/* autoplay policy — will play on first interaction */})
      // Re-trigger play when tracks are added (stream may be empty at attach time)
      const onTrack = () => video.play().catch(() => null)
      remoteStream.addEventListener("addtrack", onTrack)
      return () => remoteStream.removeEventListener("addtrack", onTrack)
    }, [remoteStream])

    function getActivePinch(): PinchState {
      if (pinchRef.current.active || pinchRef.current.pos) return pinchRef.current
      return mousePinch.current
    }

    const measureArena = useCallback(() => {
      const container = containerRef.current
      if (!container) return

      const w = container.clientWidth
      const h = container.clientHeight
      arenaW.current = w
      arenaH.current = h
      playerSize.current = w * PLAYER_SIZE_RATIO

      if (arenaCanvasRef.current) {
        arenaCanvasRef.current.width = w
        arenaCanvasRef.current.height = h
      }

      const ps = playerSize.current
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = ps
        overlayCanvasRef.current.height = ps
      }

      playerBody.current.size = ps
      opponentBody.current.size = ps
    }, [])

    const resetPositions = useCallback(() => {
      const w = arenaW.current
      const h = arenaH.current
      const ps = playerSize.current

      // Player 1 starts left, Player 2 starts right
      const myX = playerNumber === 1 ? w * 0.3 : w * 0.7
      const oppX = playerNumber === 1 ? w * 0.7 : w * 0.3

      playerBody.current.pos = { x: myX, y: h / 2 }
      playerBody.current.vel = { x: 0, y: 0 }
      playerBody.current.size = ps

      opponentBody.current.pos = { x: oppX, y: h / 2 }
      opponentBody.current.vel = { x: 0, y: 0 }
      opponentBody.current.size = ps

      ringOutFired.current = false
    }, [playerNumber])

    useImperativeHandle(ref, () => ({ resetPositions }), [resetPositions])

    useEffect(() => {
      measureArena()
      resetPositions()

      const observer = new ResizeObserver(() => measureArena())
      if (containerRef.current) observer.observe(containerRef.current)
      return () => observer.disconnect()
    }, [measureArena, resetPositions])

    const triggerFlash = useCallback(() => {
      const now = performance.now()
      if (now - lastFlashTime.current < FLASH_COOLDOWN_MS) return
      lastFlashTime.current = now

      const pEl = playerRef.current
      if (pEl) {
        pEl.style.borderColor = COLOR_HIT
        clearTimeout(flashTimeout.current)
        flashTimeout.current = setTimeout(() => {
          pEl.style.borderColor = COLOR_PLAYER
        }, FLASH_DURATION_MS)
      }

      const oEl = opponentRef.current
      if (oEl) {
        oEl.style.borderColor = COLOR_HIT
        clearTimeout(flashTimeoutOpp.current)
        flashTimeoutOpp.current = setTimeout(() => {
          oEl.style.borderColor = COLOR_OPPONENT
        }, FLASH_DURATION_MS)
      }
    }, [])

    // Game loop
    useGameLoop(() => {
      const w = arenaW.current
      const h = arenaH.current

      if (phaseRef.current !== "playing") {
        const ctx = arenaCanvasRef.current?.getContext("2d")
        if (ctx) drawArena(ctx, w, h, w * RING_RADIUS_RATIO)
        updateDom(playerRef.current, playerBody.current.pos, playerSize.current)
        updateDom(opponentRef.current, opponentBody.current.pos, playerSize.current)
        return
      }

      if (w === 0 || h === 0) return

      const ringRadius = w * RING_RADIUS_RATIO
      const activePinch = getActivePinch()
      const isPinching = activePinch.active

      // Detect pinch release -> launch (debounced: require 3 consecutive non-pinch frames
      // to avoid ghost launches from momentary hand-tracking dropouts)
      if (wasPinching.current && !isPinching) {
        releaseFrames.current++
        if (releaseFrames.current >= 3 && activePinch.pos) {
          launchBody(playerBody.current, activePinch.pos, w, h)
          pinchRef.current = { active: false, pos: null }
          mousePinch.current = { active: false, pos: null }
          releaseFrames.current = 0
        }
      } else {
        releaseFrames.current = 0
      }
      wasPinching.current = isPinching

      // Step own physics
      if (!isPinching) {
        stepBody(playerBody.current)
      }

      // Apply opponent state from network (normalized 0-1, denormalize to local pixels)
      const opp = opponentState.current
      if (opp) {
        const targetX = opp.x * w
        const targetY = opp.y * h
        const lerpFactor = 0.3
        opponentBody.current.pos.x += (targetX - opponentBody.current.pos.x) * lerpFactor
        opponentBody.current.pos.y += (targetY - opponentBody.current.pos.y) * lerpFactor
        opponentBody.current.vel.x = opp.vx * w
        opponentBody.current.vel.y = opp.vy * h
      }

      // Collisions — only push OUR body, opponent is network-authoritative
      if (isPinching) {
        // While pinching, we're immovable — no collision on us
      } else {
        if (resolveCollisionOneSided(playerBody.current, opponentBody.current)) {
          triggerFlash()
        }
      }

      // Send own state to opponent (normalized 0-1)
      onStateUpdateRef.current({
        x: playerBody.current.pos.x / w,
        y: playerBody.current.pos.y / h,
        vx: playerBody.current.vel.x / w,
        vy: playerBody.current.vel.y / h,
        pinching: isPinching,
      })

      // Ring-out detection: only detect OWN ring-out and report to server.
      // The opponent detects their own and reports it. Server confirms for both.
      // (Detecting opponent client-side causes ringOutFired to block self-detection
      //  if there's ever a sync mismatch.)
      if (!ringOutFired.current) {
        const cx = w / 2
        const cy = h / 2
        if (isRingOut(playerBody.current, cx, cy, ringRadius)) {
          ringOutFired.current = true
          onRingOutRef.current("player")
        }
      }

      // Update DOM
      updateDom(playerRef.current, playerBody.current.pos, playerSize.current)
      updateDom(opponentRef.current, opponentBody.current.pos, playerSize.current)

      // Draw
      const arenaCtx = arenaCanvasRef.current?.getContext("2d")
      if (arenaCtx) {
        const cx = w / 2
        const cy = h / 2
        const pDist = Math.hypot(playerBody.current.pos.x - cx, playerBody.current.pos.y - cy)
        const oDist = Math.hypot(opponentBody.current.pos.x - cx, opponentBody.current.pos.y - cy)
        drawArena(arenaCtx, w, h, ringRadius, pDist, oDist)
      }

      const overlayCtx = overlayCanvasRef.current?.getContext("2d")
      if (overlayCtx) {
        const ps = playerSize.current
        const handActive = pinchRef.current.active
        drawSlingshot(overlayCtx, ps, ps, handActive ? pinchRef.current.pos : null)
      }
    })

    // Mouse/touch fallback
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      if (phaseRef.current !== "playing") return
      if (e.button !== 0) return
      const box = playerRef.current
      if (!box) return
      const rect = box.getBoundingClientRect()
      const x = clamp01((e.clientX - rect.left) / rect.width)
      const y = clamp01((e.clientY - rect.top) / rect.height)
      mousePinch.current = { active: true, pos: { x, y: 1 - y } }
      containerRef.current?.setPointerCapture(e.pointerId)
    }, [])

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
      if (!mousePinch.current.active) return
      const box = playerRef.current
      if (!box) return
      const rect = box.getBoundingClientRect()
      const x = clamp01((e.clientX - rect.left) / rect.width)
      const y = clamp01((e.clientY - rect.top) / rect.height)
      mousePinch.current = { active: true, pos: { x, y: 1 - y } }
    }, [])

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
        <canvas ref={arenaCanvasRef} className="pointer-events-none absolute inset-0" />

        {/* My box */}
        <div ref={playerRef} className="player-box" style={{ borderColor: COLOR_PLAYER }}>
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

        {/* Opponent box */}
        <div ref={opponentRef} className="player-box" style={{ borderColor: COLOR_OPPONENT }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />
        </div>
      </div>
    )
  },
)

function updateDom(el: HTMLDivElement | null, pos: Vec2, size: number): void {
  if (!el) return
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.left = `${pos.x}px`
  el.style.top = `${pos.y}px`
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}
