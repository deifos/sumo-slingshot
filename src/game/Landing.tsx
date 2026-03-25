import { Button } from "@/components/ui/button"

interface LandingProps {
  onPlay: () => void
}

export function Landing({ onPlay }: LandingProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-12 bg-black p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-game text-[clamp(2rem,10vmin,6rem)] leading-none font-bold tracking-tight text-white">
          SLINGSHOT
          <br />
          WARS
        </h1>
        <p className="font-game text-[clamp(0.7rem,3vmin,1.2rem)] tracking-[0.25em] text-white/40">
          SUMO WEBCAM BATTLE
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={onPlay}
          className="font-game h-auto rounded-none border border-white/20 bg-white px-10 py-4 text-sm tracking-[0.2em] text-black transition-all hover:bg-[#c2fe0b] hover:text-black"
        >
          PLAY SOLO
        </Button>
        <Button
          disabled
          className="font-game h-auto rounded-none border border-white/10 bg-transparent px-10 py-4 text-sm tracking-[0.2em] text-white/30"
        >
          MULTIPLAYER (SOON)
        </Button>
      </div>

      <p className="font-game text-[0.65rem] tracking-wider text-white/20">
        PINCH TO GRAB &mdash; DRAG TO AIM &mdash; RELEASE TO FIRE
      </p>
    </div>
  )
}
