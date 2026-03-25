import type { Party, PartyConnection, PartyServer } from "partykit/server"

// Message types from client -> server
type ClientMessage =
  | { type: "join"; roomCode: string }
  | { type: "signal"; data: unknown }
  | { type: "ready" }
  | { type: "state"; data: unknown }
  | { type: "ring-out"; loser: "self" }
  | { type: "rematch-request" }
  | { type: "rematch-accept" }

// Message types from server -> client
type ServerMessage =
  | { type: "room-created"; roomCode: string }
  | { type: "player-joined"; playerId: string; playerNumber: 1 | 2 }
  | { type: "player-left"; playerId: string }
  | { type: "room-full" }
  | { type: "room-not-found" }
  | { type: "signal"; data: unknown; from: string }
  | { type: "both-ready"; countdown: number }
  | { type: "game-start" }
  | { type: "state"; data: unknown; from: string }
  | { type: "ring-out-confirmed"; loser: string }
  | { type: "rematch-requested"; from: string }
  | { type: "rematch-confirmed" }
  | { type: "assigned"; playerNumber: 1 | 2; playerId: string }
  | { type: "error"; message: string }

const COUNTDOWN_SECONDS = 3

export default class SlingshotServer implements PartyServer {
  private players: Map<string, PartyConnection> = new Map()
  private readyPlayers: Set<string> = new Set()
  private rematchRequests: Set<string> = new Set()
  private gameActive = false

  constructor(public room: Party) {}

  private send(conn: PartyConnection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  private broadcast(msg: ServerMessage, except?: string) {
    const data = JSON.stringify(msg)
    for (const [id, conn] of this.players) {
      if (id !== except) {
        conn.send(data)
      }
    }
  }

  private getPlayerNumber(id: string): 1 | 2 {
    const ids = [...this.players.keys()]
    return ids.indexOf(id) === 0 ? 1 : 2
  }

  onConnect(conn: PartyConnection) {
    // Room is identified by the party room ID (the room code)
    if (this.players.size >= 2) {
      this.send(conn, { type: "room-full" })
      return
    }

    this.players.set(conn.id, conn)
    const playerNumber = this.getPlayerNumber(conn.id)

    // Tell the new player their assignment
    this.send(conn, {
      type: "assigned",
      playerNumber,
      playerId: conn.id,
    })

    // Tell everyone about the new player
    this.broadcast({
      type: "player-joined",
      playerId: conn.id,
      playerNumber,
    })
  }

  onClose(conn: PartyConnection) {
    this.players.delete(conn.id)
    this.readyPlayers.delete(conn.id)
    this.rematchRequests.delete(conn.id)
    this.gameActive = false

    this.broadcast({ type: "player-left", playerId: conn.id })
  }

  onMessage(message: string, sender: PartyConnection) {
    let msg: ClientMessage
    try {
      msg = JSON.parse(message) as ClientMessage
    } catch {
      return
    }

    switch (msg.type) {
      case "signal":
        // Relay WebRTC signaling to the other player
        this.broadcast(
          { type: "signal", data: msg.data, from: sender.id },
          sender.id,
        )
        break

      case "ready":
        this.readyPlayers.add(sender.id)
        if (this.readyPlayers.size === 2 && this.players.size === 2) {
          // Both players ready — start countdown
          this.broadcast({
            type: "both-ready",
            countdown: COUNTDOWN_SECONDS,
          })

          // After countdown, signal game start
          setTimeout(() => {
            this.gameActive = true
            this.readyPlayers.clear()
            this.broadcast({ type: "game-start" })
          }, (COUNTDOWN_SECONDS + 1) * 800)
        }
        break

      case "state":
        // Relay game state to opponent (low latency path)
        this.broadcast(
          { type: "state", data: msg.data, from: sender.id },
          sender.id,
        )
        break

      case "ring-out":
        // Player declares they lost
        this.gameActive = false
        this.broadcast({
          type: "ring-out-confirmed",
          loser: sender.id,
        })
        break

      case "rematch-request":
        this.rematchRequests.add(sender.id)
        if (this.rematchRequests.size === 2) {
          // Both want rematch
          this.rematchRequests.clear()
          this.broadcast({ type: "rematch-confirmed" })
        } else {
          this.broadcast(
            { type: "rematch-requested", from: sender.id },
            sender.id,
          )
        }
        break

      case "rematch-accept":
        this.rematchRequests.add(sender.id)
        if (this.rematchRequests.size === 2) {
          this.rematchRequests.clear()
          this.broadcast({ type: "rematch-confirmed" })
        }
        break
    }
  }
}
