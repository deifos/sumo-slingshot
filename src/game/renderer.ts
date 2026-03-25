import type { Vec2 } from "./types"
import { COLOR_RING, COLOR_RING_DANGER, COLOR_PLAYER } from "./constants"

export function drawArena(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ringRadius: number,
  playerDist?: number,
  opponentDist?: number,
): void {
  ctx.clearRect(0, 0, w, h)

  const cx = w / 2
  const cy = h / 2

  // Ring boundary
  const nearEdge =
    (playerDist !== undefined && playerDist > ringRadius * 0.75) ||
    (opponentDist !== undefined && opponentDist > ringRadius * 0.75)

  ctx.strokeStyle = nearEdge ? COLOR_RING_DANGER : COLOR_RING
  ctx.lineWidth = 2
  ctx.setLineDash([10, 10])
  ctx.beginPath()
  ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Center mark
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
  ctx.beginPath()
  ctx.arc(cx, cy, 4, 0, Math.PI * 2)
  ctx.fill()

  // Center line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(cx, cy - ringRadius)
  ctx.lineTo(cx, cy + ringRadius)
  ctx.stroke()
}

export function drawSlingshot(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pinchPos: Vec2 | null,
): void {
  ctx.clearRect(0, 0, w, h)

  const cx = w / 2
  const cy = h / 2
  const sq = w * 0.055

  // Center square (always visible)
  ctx.fillStyle = COLOR_PLAYER
  ctx.fillRect(cx - sq, cy - sq, sq * 2, sq * 2)

  if (!pinchPos) return

  // Mirror X for display on the mirrored video
  const px = (1 - pinchPos.x) * w
  const py = pinchPos.y * h
  const dist = Math.hypot(px - cx, py - cy)

  // Dotted circle
  ctx.strokeStyle = "rgba(255, 255, 255, 1)"
  ctx.lineWidth = 2.5
  ctx.setLineDash([4, 6])
  ctx.beginPath()
  ctx.arc(cx, cy, dist, 0, Math.PI * 2)
  ctx.stroke()

  // Line from center to tracking point
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(px, py)
  ctx.stroke()
  ctx.setLineDash([])

  // Tracking square
  ctx.strokeStyle = "#01ffff"
  ctx.lineWidth = 2
  ctx.strokeRect(px - sq, py - sq, sq * 2, sq * 2)
}
