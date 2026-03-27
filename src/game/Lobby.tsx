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
  const [copied, setCopied] = useState<"code" | "link" | null>(null)

  const shareUrl = `${window.location.origin}${window.location.pathname}?join=${roomCode}`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied("code")
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied("link")
      setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-black p-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <h2 className="font-game text-lg tracking-[0.3em] text-white/40">
          {mode === "create" ? "ROOM CREATED" : "JOINING ROOM"}
        </h2>

        {/* Room code */}
        <button
          onClick={handleCopyCode}
          className="font-game group flex cursor-pointer items-center gap-3 rounded-none border border-white/20 bg-white/5 px-8 py-5 transition-colors hover:bg-white/10"
        >
          <span className="text-[clamp(2rem,12vmin,5rem)] leading-none tracking-[0.4em] text-white">
            {roomCode}
          </span>
          <span className="font-game text-xs tracking-wider text-white/30 group-hover:text-white/50">
            {copied === "code" ? "COPIED" : "COPY"}
          </span>
        </button>

        {/* Shareable link */}
        <button
          onClick={handleCopyLink}
          className="group flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2.5 transition-all hover:border-[#c2fe0b]/30 hover:bg-[#c2fe0b]/5"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-white/30 group-hover:text-[#c2fe0b]/60"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span className="font-game max-w-[260px] truncate text-[0.6rem] tracking-wider text-white/30 group-hover:text-[#c2fe0b]/60">
            {shareUrl}
          </span>
          <span className="font-game shrink-0 text-[0.6rem] tracking-wider text-white/20 group-hover:text-[#c2fe0b]/50">
            {copied === "link" ? "COPIED!" : "COPY LINK"}
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
