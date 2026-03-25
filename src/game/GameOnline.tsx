import { useCallback, useEffect, useRef, useState } from "react"
import type { GamePhase, Winner } from "./types"
import type { MultiplayerState } from "./multiplayer"
import { COUNTDOWN_SECONDS } from "./constants"
import { ArenaMultiplayer, type ArenaMultiplayerHandle } from "./ArenaMultiplayer"
import { Countdown } from "./Countdown"
import { Results } from "./Results"
import { Hud } from "./Hud"
import { Lobby } from "./Lobby"
import { useMultiplayer } from "./useMultiplayer"
import { VERSION } from "./version"

interface GameOnlineProps {
  mode: "create" | "join"
  roomCode: string
  onExit: () => void
}

export function GameOnline({ mode, roomCode, onExit }: GameOnlineProps) {
  const [phase, setPhase] = useState<GamePhase>("landing") // "landing" = lobby phase here
  const [winner, setWinner] = useState<Winner>(null)
  const [scores, setScores] = useState({ player: 0, opponent: 0 })
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const arenaRef = useRef<ArenaMultiplayerHandle>(null)
  const opponentState = useRef<MultiplayerState | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  // Get webcam stream for WebRTC (mediaDevices requires HTTPS or localhost)
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn("Camera unavailable — requires HTTPS or localhost")
      return
    }

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 640, facingMode: "user" }, audio: false })
      .then(setLocalStream)
      .catch(() => console.warn("Camera access denied"))

    return () => {
      localStream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGameStart = useCallback(() => {
    setPhase("countdown")
    setCountdown(COUNTDOWN_SECONDS)

    let count = COUNTDOWN_SECONDS
    const interval = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else if (count === 0) {
        setCountdown(0)
      } else {
        clearInterval(interval)
        setPhase("playing")
      }
    }, 800)
  }, [])

  const handleOpponentState = useCallback((state: MultiplayerState) => {
    opponentState.current = state
  }, [])

  const handleRingOutConfirmed = useCallback(
    (iLost: boolean) => {
      const w: Winner = iLost ? "opponent" : "player"
      setWinner(w)
      setScores((prev) => ({
        ...prev,
        [w]: prev[w as keyof typeof prev] + 1,
      }))
      setPhase("results")
    },
    [],
  )

  const mp = useMultiplayer({
    roomCode,
    localStream,
    onGameStart: handleGameStart,
    onOpponentState: handleOpponentState,
    onRingOutConfirmed: handleRingOutConfirmed,
    onRematchConfirmed: () => {
      setWinner(null)
      arenaRef.current?.resetPositions()
      opponentState.current = null
      // Both players ready again
      mp.sendReady()
    },
  })

  // When opponent joins and we're in lobby, both signal ready
  useEffect(() => {
    if (mp.status === "opponent-joined" && phase === "landing") {
      mp.sendReady()
    }
  }, [mp.status, phase, mp])

  const handleRingOut = useCallback(
    (who: "player" | "opponent") => {
      if (who === "player") {
        // I went out — tell the server I lost
        mp.sendRingOut()
      }
      // Wait for server confirmation before showing results
    },
    [mp],
  )

  const handleStateUpdate = useCallback(
    (state: MultiplayerState) => {
      mp.sendState(state)
    },
    [mp],
  )

  const handleRematch = useCallback(() => {
    mp.sendRematchRequest()
  }, [mp])

  // Show lobby while waiting for opponent
  if (phase === "landing" && (mp.status === "connecting" || mp.status === "waiting" || mp.status === "room-full" || mp.status === "disconnected")) {
    return <Lobby mode={mode} roomCode={roomCode} status={mp.status} onBack={onExit} />
  }

  // Show lobby when opponent just joined (before game starts)
  if (phase === "landing" && mp.status === "opponent-joined") {
    return <Lobby mode={mode} roomCode={roomCode} status={mp.status} onBack={onExit} />
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-black">
      <ArenaMultiplayer
        ref={arenaRef}
        phase={phase}
        playerNumber={mp.playerNumber}
        remoteStream={mp.remoteStream}
        onRingOut={handleRingOut}
        onStateUpdate={handleStateUpdate}
        opponentState={opponentState}
      />
      <Hud scores={scores} />
      {phase === "countdown" && <Countdown count={countdown} />}
      {phase === "results" && (
        <Results
          winner={winner}
          scores={scores}
          onRematch={handleRematch}
          onExit={() => {
            mp.disconnect()
            onExit()
          }}
          rematchLabel={
            mp.opponentWantsRematch
              ? "ACCEPT REMATCH"
              : undefined
          }
        />
      )}
      <span className="font-game pointer-events-none absolute bottom-2 right-3 z-10 text-[0.5rem] tracking-wider text-white/10">
        v{VERSION}
      </span>
    </div>
  )
}
