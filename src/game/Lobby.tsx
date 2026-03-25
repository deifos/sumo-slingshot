import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { RoomStatus } from "./multiplayer"

interface LobbyProps {
  mode: "create" | "join"
  roomCode: string
  status: RoomStatus
  onBack: () => void
}

export function Lobby({ mode, roomCode, status, onBack }: LobbyProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-10 bg-black p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-game text-lg tracking-[0.3em] text-white/40">
          {mode === "create" ? "ROOM CREATED" : "JOINING ROOM"}
        </h2>

        {/* Room code display */}
        <button
          onClick={handleCopy}
          className="font-game group flex cursor-pointer items-center gap-3 rounded-none border border-white/20 bg-white/5 px-8 py-5 transition-colors hover:bg-white/10"
        >
          <span className="text-[clamp(2rem,12vmin,5rem)] leading-none tracking-[0.4em] text-white">
            {roomCode}
          </span>
          <span className="font-game text-xs tracking-wider text-white/30 group-hover:text-white/50">
            {copied ? "COPIED" : "COPY"}
          </span>
        </button>

        {/* Status message */}
        <StatusMessage status={status} />
      </div>

      <Button
        onClick={onBack}
        variant="ghost"
        className="font-game h-auto rounded-none border border-white/10 px-8 py-3 text-sm tracking-[0.2em] text-white/40 hover:text-white"
      >
        BACK
      </Button>
    </div>
  )
}

function StatusMessage({ status }: { status: RoomStatus }) {
  switch (status) {
    case "connecting":
      return (
        <p className="font-game animate-pulse text-sm tracking-wider text-white/30">
          CONNECTING...
        </p>
      )
    case "waiting":
      return (
        <p className="font-game animate-pulse text-sm tracking-wider text-white/30">
          WAITING FOR OPPONENT...
        </p>
      )
    case "opponent-joined":
      return (
        <p className="font-game text-sm tracking-wider text-[#c2fe0b]">
          OPPONENT CONNECTED
        </p>
      )
    case "room-full":
      return (
        <p className="font-game text-sm tracking-wider text-[#ff0d1a]">
          ROOM IS FULL
        </p>
      )
    case "disconnected":
      return (
        <p className="font-game text-sm tracking-wider text-[#ff0d1a]">
          DISCONNECTED
        </p>
      )
    default:
      return null
  }
}
