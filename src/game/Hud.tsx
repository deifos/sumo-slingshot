interface HudProps {
  scores: { player: number; opponent: number }
}

export function Hud({ scores }: HudProps) {
  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 bg-[#c2fe0b]" />
        <span className="font-game text-sm tracking-wider text-white/80">
          YOU {scores.player}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-game text-sm tracking-wider text-white/80">
          {scores.opponent} BOT
        </span>
        <div className="h-3 w-3 bg-[#01ffff]" />
      </div>
    </div>
  )
}
