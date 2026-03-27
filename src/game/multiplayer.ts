// Room code generation + shared types

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  let code = ""
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export type PlayerNumber = 1 | 2

export interface MultiplayerState {
  x: number
  y: number
  vx: number
  vy: number
  pinching: boolean
  avatar?: string // "camera" or emoji string
}

export const AVATAR_OPTIONS = ["camera", "🐼", "🦊", "🤖", "👾", "🐸", "🦁"] as const

export type RoomStatus =
  | "connecting"
  | "waiting"
  | "opponent-joined"
  | "countdown"
  | "playing"
  | "disconnected"
  | "room-full"
