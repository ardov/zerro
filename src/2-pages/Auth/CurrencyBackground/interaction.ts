export const defaultCurrencySettings = {
  radius: 280,
  rowImpulse: 400,
  pileImpulse: 350,
  springStiffness: 140,
  springDamping: 11,
  gravity: 1,
  restitution: 0.3,
  airFriction: 0.008,
  releaseDuration: 3500,
  collapseAfterClicks: 10,
}

export type CurrencySettings = typeof defaultCurrencySettings
export type Point = { x: number; y: number }
export type SpringState = { x: number; y: number; vx: number; vy: number }

/** A soft radial impulse in CSS pixels per second, fading to zero at the edge. */
export function clickImpulse(
  position: Point,
  cursor: Point,
  radius: number,
  strength: number,
  lift = 0
): Point {
  const dx = position.x - cursor.x
  const dy = position.y - cursor.y
  const distance = Math.hypot(dx, dy)
  if (radius <= 0 || distance >= radius) return { x: 0, y: 0 }
  const impulse = strength * (1 - distance / radius) ** 1.5
  return {
    x: (distance > 0.1 ? dx / distance : 0) * impulse,
    y: ((distance > 0.1 ? dy / distance : -1) - lift) * impulse,
  }
}

/** Fixed small steps keep even the sandbox's stiff springs stable. */
export function advanceSpring(
  state: SpringState,
  delta: number,
  settings: CurrencySettings
) {
  let remaining = Math.min(delta, 0.05)
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 120)
    state.vx +=
      (-settings.springStiffness * state.x -
        settings.springDamping * state.vx) *
      dt
    state.vy +=
      (-settings.springStiffness * state.y -
        settings.springDamping * state.vy) *
      dt
    state.x += state.vx * dt
    state.y += state.vy * dt
    remaining -= dt
  }
  return (
    Math.hypot(state.x, state.y) < 0.02 && Math.hypot(state.vx, state.vy) < 0.02
  )
}
