export interface Vec2 {
  x: number
  y: number
}

export interface Body {
  pos: Vec2
  vel: Vec2
  size: number
  mass: number
}

export type GamePhase = "landing" | "countdown" | "playing" | "results"

export type Winner = "player" | "opponent" | null
