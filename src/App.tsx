import { useState } from "react"
import { Landing } from "@/game/Landing"
import { Game } from "@/game/Game"

type Screen = "landing" | "game"

export function App() {
  const [screen, setScreen] = useState<Screen>("landing")

  if (screen === "game") {
    return <Game onExit={() => setScreen("landing")} />
  }

  return <Landing onPlay={() => setScreen("game")} />
}

export default App
