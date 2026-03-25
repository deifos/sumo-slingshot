import { Button } from "@/components/ui/button"
import type { Winner } from "./types"

interface ResultsProps {
  winner: Winner
  scores: { player: number; opponent: number }
  onRematch: () => void
  onExit: () => void
}

export function Results({ winner, scores, onRematch, onExit }: ResultsProps) {
  const isPlayerWin = winner === "player"

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <span
            className="font-game text-[clamp(2rem,10vmin,5rem)] leading-none font-bold tracking-tight"
            style={{ color: isPlayerWin ? "#c2fe0b" : "#ff0d1a" }}
          >
            {isPlayerWin ? "YOU WIN" : "RING OUT"}
          </span>
          <span className="font-game text-base tracking-[0.3em] text-white/50">
            {scores.player} &mdash; {scores.opponent}
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onRematch}
            className="font-game h-auto rounded-none border border-white/20 bg-white px-8 py-3 text-sm tracking-[0.2em] text-black transition-all hover:bg-[#c2fe0b]"
          >
            REMATCH
          </Button>
          <Button
            onClick={onExit}
            variant="ghost"
            className="font-game h-auto rounded-none border border-white/10 px-8 py-3 text-sm tracking-[0.2em] text-white/50 hover:text-white"
          >
            MENU
          </Button>
        </div>
      </div>
    </div>
  )
}
