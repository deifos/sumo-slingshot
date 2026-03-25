import type { Body } from "./types"
import { BOT_SHOOT_MIN_MS, BOT_SHOOT_MAX_MS, BOT_LAUNCH_FORCE, RING_RADIUS_RATIO } from "./constants"

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export class Bot {
  private nextShootTime = 0

  constructor() {
    this.scheduleNext()
  }

  private scheduleNext(): void {
    this.nextShootTime = performance.now() + randomBetween(BOT_SHOOT_MIN_MS, BOT_SHOOT_MAX_MS)
  }

  reset(): void {
    this.scheduleNext()
  }

  update(botBody: Body, playerBody: Body, arenaW: number, arenaH: number): void {
    if (performance.now() < this.nextShootTime) return

    const cx = arenaW / 2
    const cy = arenaH / 2
    const ringRadius = arenaW * RING_RADIUS_RATIO

    // How far is the bot from center?
    const botDistFromCenter = Math.hypot(botBody.pos.x - cx, botBody.pos.y - cy)

    // If bot is near the edge, aim back toward center instead of at the player
    const nearEdge = botDistFromCenter > ringRadius * 0.6
    let targetX: number
    let targetY: number

    if (nearEdge) {
      // Retreat toward center
      targetX = cx
      targetY = cy
    } else {
      // Aim toward the player
      targetX = playerBody.pos.x
      targetY = playerBody.pos.y
    }

    const dx = targetX - botBody.pos.x
    const dy = targetY - botBody.pos.y
    const dist = Math.hypot(dx, dy)

    if (dist < 1) return

    const spread = 0.25
    const dirX = dx / dist + (Math.random() - 0.5) * spread
    const dirY = dy / dist + (Math.random() - 0.5) * spread

    // Scale force based on distance — closer = softer shot
    const distRatio = Math.min(dist / (ringRadius * 1.2), 1)
    const force = BOT_LAUNCH_FORCE * (0.5 + 0.5 * distRatio)

    botBody.vel.x = dirX * arenaW * force
    botBody.vel.y = dirY * arenaH * force

    this.scheduleNext()
  }
}
