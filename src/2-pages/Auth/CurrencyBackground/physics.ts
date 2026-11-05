import Matter from 'matter-js'
import { createReleaseDelays } from './release'
import { clickImpulse, defaultCurrencySettings } from './interaction'
import type { CurrencySettings, Point } from './interaction'

const { Bodies, Body, Composite, Engine, Sleeping } = Matter
const step = 1000 / 120
const maxDuration = 10000

export type GlyphSeed = {
  x: number
  y: number
  width: number
  height: number
  angle: number
  velocityX: number
  velocityY: number
}

/** Glyph-sized blocks above a floor with open sides. The canvas owns the clock. */
export function createGlyphPile(
  seeds: GlyphSeed[],
  width: number,
  height: number,
  initialSettings: CurrencySettings = defaultCurrencySettings
) {
  let settings = initialSettings
  const engine = Engine.create({ enableSleeping: false })
  engine.gravity.y = settings.gravity
  let elapsed = 0
  let settleBy = maxDuration
  let remainder = 0
  const releaseDelays = createReleaseDelays(
    seeds,
    width,
    height,
    settings.releaseDuration
  )
  const releaseOrder = seeds
    .map((_, i) => i)
    .sort((a, b) => releaseDelays[a] - releaseDelays[b])
  let released = 0
  const retired = new Set<Matter.Body>()
  let floor: Matter.Body | undefined
  const bodies = seeds.map(seed => {
    const body = Bodies.rectangle(seed.x, seed.y, seed.width, seed.height, {
      angle: seed.angle,
      friction: 0.65,
      frictionStatic: 1,
      frictionAir: settings.airFriction,
      restitution: settings.restitution,
      sleepThreshold: 45,
    })
    // Pin after creation so release can restore the glyph's finite mass.
    Body.setStatic(body, true)
    return body
  })
  Composite.add(engine.world, bodies)

  function setFloor() {
    if (floor) Composite.remove(engine.world, floor)
    floor = Bodies.rectangle(width / 2, height + 50, width + 200, 100, {
      isStatic: true,
    })
    Composite.add(engine.world, floor)
  }
  setFloor()

  return {
    bodies,
    retired,
    releaseDelays,
    get elapsed() {
      return elapsed
    },
    configure(next: CurrencySettings) {
      settings = next
      engine.gravity.y = settings.gravity
      bodies.forEach(body => {
        body.frictionAir = settings.airFriction
        if (!body.isStatic) body.restitution = settings.restitution
      })
    },
    repulse(cursor: Point) {
      let affected = false
      bodies.forEach(body => {
        if (body.isStatic || retired.has(body)) return
        const impulse = clickImpulse(
          body.position,
          cursor,
          settings.radius,
          settings.pileImpulse,
          0.6
        )
        if (!impulse.x && !impulse.y) return
        Sleeping.set(body, false)
        Body.setVelocity(body, {
          x: body.velocity.x + impulse.x / 60,
          y: body.velocity.y + impulse.y / 60,
        })
        affected = true
      })
      if (affected) settleBy = elapsed + maxDuration
      return affected
    },
    /** Fixed substeps keep collisions stable across display refresh rates. */
    advance(delta: number) {
      remainder += Math.min(delta, 50)
      while (remainder + 0.000001 >= step) {
        while (
          released < releaseOrder.length &&
          releaseDelays[releaseOrder[released]] <= elapsed
        ) {
          const index = releaseOrder[released++]
          const body = bodies[index]
          Body.setStatic(body, false)
          body.restitution = settings.restitution
          Sleeping.set(body, false)
          Body.setVelocity(body, {
            x: seeds[index].velocityX / 60,
            y: seeds[index].velocityY / 60,
          })
        }
        // A glyph resting on a pinned region must fall when its support lets go.
        engine.enableSleeping = released === bodies.length
        Engine.update(engine, step)
        remainder -= step
        elapsed += step
      }
      // Beyond the bottom of the finite floor, escaped glyphs cannot return.
      // Keep their array slots for sprites, but remove them from collision work.
      bodies.forEach(body => {
        if (retired.has(body) || body.bounds.min.y <= height + 100) return
        retired.add(body)
        Composite.remove(engine.world, body)
        Sleeping.set(body, true)
      })
      // Tall piles can keep tiny contact vibrations alive indefinitely.
      if (elapsed >= settleBy) bodies.forEach(body => Sleeping.set(body, true))
      return released === bodies.length && bodies.every(body => body.isSleeping)
    },
    resize(nextWidth: number, nextHeight: number) {
      bodies.forEach(body => {
        if (retired.has(body)) return
        const halfHeight = (body.bounds.max.y - body.bounds.min.y) / 2
        Body.setPosition(body, {
          x: (body.position.x / width) * nextWidth,
          y: Math.min(
            nextHeight - halfHeight,
            body.position.y + nextHeight - height
          ),
        })
        Sleeping.set(body, false)
      })
      width = nextWidth
      height = nextHeight
      settleBy = elapsed + maxDuration
      setFloor()
    },
    dispose() {
      Composite.clear(engine.world, false)
      Engine.clear(engine)
    },
  }
}
