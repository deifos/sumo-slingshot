import type { Body, Vec2 } from "./types"
import { FRICTION, RESTITUTION, LAUNCH_MULT } from "./constants"

export function stepBody(body: Body): void {
  body.pos.x += body.vel.x
  body.pos.y += body.vel.y
  body.vel.x *= FRICTION
  body.vel.y *= FRICTION
  if (Math.abs(body.vel.x) < 0.05) body.vel.x = 0
  if (Math.abs(body.vel.y) < 0.05) body.vel.y = 0
}

export function resolveCollision(
  a: Body,
  b: Body,
  e: number = RESTITUTION,
): boolean {
  const aHalf = a.size / 2
  const bHalf = b.size / 2

  const ox = Math.min(a.pos.x + aHalf, b.pos.x + bHalf) -
    Math.max(a.pos.x - aHalf, b.pos.x - bHalf)
  const oy = Math.min(a.pos.y + aHalf, b.pos.y + bHalf) -
    Math.max(a.pos.y - aHalf, b.pos.y - bHalf)

  if (ox <= 0 || oy <= 0) return false

  const mA = a.mass
  const mB = b.mass
  const mt = mA + mB

  if (ox < oy) {
    const dir = a.pos.x < b.pos.x ? 1 : -1
    a.pos.x -= dir * ox * (mB / mt)
    b.pos.x += dir * ox * (mA / mt)
    const va = a.vel.x
    const vb = b.vel.x
    a.vel.x = ((mA - e * mB) * va + (1 + e) * mB * vb) / mt
    b.vel.x = ((mB - e * mA) * vb + (1 + e) * mA * va) / mt
  } else {
    const dir = a.pos.y < b.pos.y ? 1 : -1
    a.pos.y -= dir * oy * (mB / mt)
    b.pos.y += dir * oy * (mA / mt)
    const va = a.vel.y
    const vb = b.vel.y
    a.vel.y = ((mA - e * mB) * va + (1 + e) * mB * vb) / mt
    b.vel.y = ((mB - e * mA) * vb + (1 + e) * mA * va) / mt
  }

  return true
}

export function isRingOut(
  body: Body,
  centerX: number,
  centerY: number,
  ringRadius: number,
): boolean {
  const dx = body.pos.x - centerX
  const dy = body.pos.y - centerY
  return Math.hypot(dx, dy) > ringRadius + body.size / 2
}

export function launchBody(body: Body, pinchPos: Vec2, arenaW: number, arenaH: number): void {
  const dx = pinchPos.x - 0.5
  const dy = pinchPos.y - 0.5
  body.vel.x = dx * arenaW * LAUNCH_MULT
  body.vel.y = -dy * arenaH * LAUNCH_MULT
}

export function createBody(x: number, y: number, size: number, mass: number): Body {
  return {
    pos: { x, y },
    vel: { x: 0, y: 0 },
    size,
    mass,
  }
}
