import { useCallback, useEffect, useRef, useState } from "react"
import type { GamePhase, Winner } from "./types"
import { COUNTDOWN_SECONDS } from "./constants"
import { Arena, type ArenaHandle } from "./Arena"
import { Countdown } from "./Countdown"
import { Results } from "./Results"
import { Hud } from "./Hud"
import { VERSION } from "./version"

interface GameProps {
  avatar: string
  onExit: () => void
}

export function Game({ avatar, onExit }: GameProps) {
  const [phase, setPhase] = useState<GamePhase>("landing")
  const [winner, setWinner] = useState<Winner>(null)
  const [scores, setScores] = useState({ player: 0, opponent: 0 })
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const arenaRef = useRef<ArenaHandle>(null)

  const handleCameraReady = useCallback(() => {
    setPhase("countdown")
  }, [])

  // Countdown timer
  useEffect(() => {
    if (phase !== "countdown") return

    setCountdown(COUNTDOWN_SECONDS)

    // Show countdown numbers, then "FIGHT!", then start playing
    let count = COUNTDOWN_SECONDS
    const interval = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else if (count === 0) {
        setCountdown(0) // Shows "FIGHT!"
      } else {
        clearInterval(interval)
        setPhase("playing")
      }
    }, 800)

    return () => clearInterval(interval)
  }, [phase])

  const handleRingOut = useCallback((who: "player" | "opponent") => {
    const w: Winner = who === "player" ? "opponent" : "player"
    setWinner(w)
    setScores((prev) => ({
      ...prev,
      [w]: prev[w as keyof typeof prev] + 1,
    }))
    setPhase("results")
  }, [])

  const handleRematch = useCallback(() => {
    setWinner(null)
    arenaRef.current?.resetPositions()
    setPhase("countdown")
  }, [])

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-black">
      <Arena ref={arenaRef} phase={phase} avatar={avatar} onRingOut={handleRingOut} onCameraReady={handleCameraReady} />
      {phase === "landing" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <p className="font-game animate-pulse text-sm tracking-[0.3em] text-white/40">
            LOADING CAMERA...
          </p>
        </div>
      )}
      <Hud scores={scores} />
      {phase === "countdown" && <Countdown count={countdown} />}
      {phase === "results" && (
        <Results
          winner={winner}
          scores={scores}
          onRematch={handleRematch}
          onExit={onExit}
        />
      )}
      <span className="font-game pointer-events-none absolute bottom-2 right-3 z-10 text-[0.5rem] tracking-wider text-white/10">
        v{VERSION}
      </span>
    </div>
  )
}
