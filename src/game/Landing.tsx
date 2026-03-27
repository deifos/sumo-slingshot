import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Footer } from "./Footer"
import { VERSION } from "./version"
import { AVATAR_OPTIONS } from "./multiplayer"

interface LandingProps {
  onPlay: (avatar: string) => void
  onCreateRoom: (avatar: string) => void
  onJoinRoom: (code: string, avatar: string) => void
  initialJoinCode?: string
}

export function Landing({ onPlay, onCreateRoom, onJoinRoom, initialJoinCode }: LandingProps) {
  const [joinMode, setJoinMode] = useState(!!initialJoinCode)
  const [code, setCode] = useState(initialJoinCode ?? "")
  const [avatar, setAvatar] = useState<string>("camera")

  const handleJoinSubmit = () => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length === 4) {
      onJoinRoom(trimmed, avatar)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-black">
      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-10 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-game text-[clamp(2rem,10vmin,6rem)] leading-none font-bold tracking-tight text-white">
            SUMO
            <br />
            SLINGSHOT
          </h1>
          <p className="font-game text-[clamp(0.7rem,3vmin,1.2rem)] tracking-[0.25em] text-white/40">
            SUMO WEBCAM BATTLE
          </p>
        </div>

        {/* Avatar picker */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-game text-[0.6rem] tracking-[0.3em] text-white/30">AVATAR</span>
          <div className="flex gap-2">
            {AVATAR_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setAvatar(opt)}
                className={`flex h-10 w-10 items-center justify-center border text-xl transition-all ${
                  avatar === opt
                    ? "border-[#c2fe0b] bg-[#c2fe0b]/10"
                    : "border-white/20 bg-white/5 hover:border-white/40"
                }`}
                title={opt === "camera" ? "Webcam" : opt}
              >
                {opt === "camera" ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={avatar === "camera" ? "text-[#c2fe0b]" : "text-white/50"}
                  >
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                ) : (
                  opt
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={() => onPlay(avatar)}
            className="font-game h-auto w-56 rounded-none border border-white/20 bg-white px-10 py-4 text-sm tracking-[0.2em] text-black transition-all hover:bg-[#c2fe0b] hover:text-black"
          >
            PLAY SOLO
          </Button>
          <Button
            onClick={() => onCreateRoom(avatar)}
            className="font-game h-auto w-56 rounded-none border border-[#01ffff]/30 bg-[#01ffff]/10 px-10 py-4 text-sm tracking-[0.2em] text-[#01ffff] transition-all hover:bg-[#01ffff]/20"
          >
            CREATE ROOM
          </Button>

          {!joinMode ? (
            <Button
              onClick={() => setJoinMode(true)}
              variant="ghost"
              className="font-game h-auto w-56 rounded-none border border-white/10 px-10 py-4 text-sm tracking-[0.2em] text-white/40 hover:text-white"
            >
              JOIN ROOM
            </Button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                placeholder="CODE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoinSubmit()}
                autoFocus
                className="font-game h-auto w-32 rounded-none border border-white/20 bg-white/5 px-4 py-4 text-center text-lg tracking-[0.4em] text-white placeholder:text-white/20 focus:border-[#01ffff]/50 focus:outline-none"
              />
              <Button
                onClick={handleJoinSubmit}
                disabled={code.trim().length !== 4}
                className="font-game h-auto rounded-none border border-[#01ffff]/30 bg-[#01ffff]/10 px-6 py-4 text-sm tracking-[0.2em] text-[#01ffff] transition-all hover:bg-[#01ffff]/20 disabled:opacity-30"
              >
                GO
              </Button>
            </div>
          )}
        </div>

        <p className="font-game text-[0.65rem] tracking-wider text-white/20">
          PINCH TO GRAB &mdash; DRAG TO AIM &mdash; RELEASE TO FIRE
        </p>

        <span className="font-game text-[0.55rem] tracking-wider text-white/10">
          v{VERSION}
        </span>
      </div>

      <Footer />
    </div>
  )
}
