import { useCallback, useEffect, useRef, useState } from "react"
import type { GamePhase, Winner } from "./types"
import { COUNTDOWN_SECONDS } from "./constants"
import { Arena, type ArenaHandle } from "./Arena"
import { Countdown } from "./Countdown"
import { Results } from "./Results"
import { Hud } from "./Hud"

interface GameProps {
  onExit: () => void
}

export function Game({ onExit }: GameProps) {
  const [phase, setPhase] = useState<GamePhase>("countdown")
  const [winner, setWinner] = useState<Winner>(null)
  const [scores, setScores] = useState({ player: 0, opponent: 0 })
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const arenaRef = useRef<ArenaHandle>(null)

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
      <Arena ref={arenaRef} phase={phase} onRingOut={handleRingOut} />
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
    </div>
  )
}
