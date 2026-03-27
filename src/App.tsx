import { useCallback, useState } from "react"
import { Landing } from "@/game/Landing"
import { Game } from "@/game/Game"
import { GameOnline } from "@/game/GameOnline"
import { generateRoomCode } from "@/game/multiplayer"

type Screen =
  | { type: "landing" }
  | { type: "solo" }
  | { type: "online"; mode: "create" | "join"; roomCode: string }

function getInitialJoinCode(): string | undefined {
  const params = new URLSearchParams(window.location.search)
  const code = params.get("join")?.trim().toUpperCase()
  return code?.length === 4 ? code : undefined
}

export function App() {
  const [screen, setScreen] = useState<Screen>({ type: "landing" })
  const [avatar, setAvatar] = useState("camera")

  const goHome = useCallback(() => {
    // Clear ?join= param from URL when going back to landing
    window.history.replaceState(null, "", window.location.pathname)
    setScreen({ type: "landing" })
  }, [])

  if (screen.type === "solo") {
    return <Game avatar={avatar} onExit={goHome} />
  }

  if (screen.type === "online") {
    return (
      <GameOnline
        mode={screen.mode}
        roomCode={screen.roomCode}
        avatar={avatar}
        onExit={goHome}
      />
    )
  }

  return (
    <Landing
      initialJoinCode={getInitialJoinCode()}
      onPlay={(av) => { setAvatar(av); setScreen({ type: "solo" }) }}
      onCreateRoom={(av) => {
        setAvatar(av)
        setScreen({ type: "online", mode: "create", roomCode: generateRoomCode() })
      }}
      onJoinRoom={(code, av) => {
        setAvatar(av)
        setScreen({ type: "online", mode: "join", roomCode: code })
      }}
    />
  )
}

export default App
