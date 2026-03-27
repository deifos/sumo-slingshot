import type { Vec2 } from "./types"
import { COLOR_RING, COLOR_RING_DANGER, COLOR_PLAYER, COLOR_OPPONENT } from "./constants"

// Standard MediaPipe Hands connections
const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],          // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],          // index
  [0, 9], [9, 10], [10, 11], [11, 12],     // middle
  [0, 13], [13, 14], [14, 15], [15, 16],   // ring
  [0, 17], [17, 18], [18, 19], [19, 20],   // pinky
  [5, 9], [9, 13], [13, 17],               // palm knuckles
]

export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarkSets: HandLandmark[][],
  pinchPos: Vec2 | null,
): void {
  ctx.clearRect(0, 0, w, h)

  const cx = w / 2
  const cy = h / 2
  const sq = w * 0.055

  // Draw slingshot pull-back lines first (same as drawSlingshot)
  if (pinchPos) {
    const px = (1 - pinchPos.x) * w
    const py = pinchPos.y * h
    const dist = Math.hypot(px - cx, py - cy)

    ctx.strokeStyle = "rgba(255, 255, 255, 1)"
    ctx.lineWidth = 2.5
    ctx.setLineDash([4, 6])
    ctx.beginPath()
    ctx.arc(cx, cy, dist, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(px, py)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.strokeStyle = "#01ffff"
    ctx.lineWidth = 2
    ctx.strokeRect(px - sq, py - sq, sq * 2, sq * 2)
  }

  // Hand skeleton
  for (const lm of landmarkSets) {
    const lx = (i: number) => (1 - lm[i].x) * w
    const ly = (i: number) => lm[i].y * h

    ctx.strokeStyle = "rgba(255,255,255,0.35)"
    ctx.lineWidth = 1.5
    ctx.setLineDash([])
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo(lx(a), ly(a))
      ctx.lineTo(lx(b), ly(b))
      ctx.stroke()
    }

    for (let i = 0; i < lm.length; i++) {
      const isTip = i === 4 || i === 8
      ctx.fillStyle = isTip ? (pinchPos ? COLOR_OPPONENT : "white") : "rgba(255,255,255,0.6)"
      ctx.beginPath()
      ctx.arc(lx(i), ly(i), isTip ? 5 : 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Center aim square (always on top)
  ctx.fillStyle = COLOR_PLAYER
  ctx.fillRect(cx - sq, cy - sq, sq * 2, sq * 2)
}

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
