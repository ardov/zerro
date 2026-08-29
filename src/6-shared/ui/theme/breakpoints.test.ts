import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { TBreakpoint, TBreakpointDown } from './breakpoints'
import { breakpoints, mediaQueryDown } from './breakpoints'

const keys = Object.keys(breakpoints) as TBreakpoint[]
const downKeys = keys.filter(key => key !== 'xs') as TBreakpointDown[]

const tailwind = readFileSync(
  resolve(process.cwd(), 'src/tailwind.css'),
  'utf8'
)

describe('breakpoints', () => {
  // A `down` query stops short of the breakpoint rather than at it, so that
  // `down('md')` and a `md:` utility cannot both match at 900px. What matters
  // is that property, not the 0.05px used to reach it, so the
  // bound is read back out of the query and compared to the breakpoint it
  // names. The subtraction going missing makes the first assertion fail; a
  // change to the breakpoints themselves changes nothing here.
  it('stops a `down` query short of the breakpoint it names', () => {
    expect(downKeys.length).toBeGreaterThan(0)
    downKeys.forEach(key => {
      const bound = Number(
        mediaQueryDown(key).match(/max-width:\s*([\d.]+)px/)![1]
      )
      expect(bound).toBeLessThan(breakpoints[key])
      // And by less than one device pixel, so nothing that can actually be a
      // viewport width falls into the gap between the two. The bound is a
      // whole pixel rather than the 0.05 the subtraction aims for: `b - 0.05`
      // is not representable, and for most integer breakpoints the difference
      // reads back a hair over 0.05 — an assertion on that number would fail
      // on binary rounding the first time a breakpoint moved.
      expect(breakpoints[key] - bound).toBeLessThan(1)
    })
  })

  // Tailwind cannot read TypeScript, so `src/tailwind.css` restates these
  // numbers — the one place in the scheme where a value has to be changed
  // twice. Nothing else notices when only one half moves: the project keeps
  // compiling and `md:` simply starts switching at a different pixel than
  // `useBreakpointDown('md')`.
  it('matches the mirror in tailwind.css, in pixels', () => {
    // `xs` is 0, which is every viewport — Tailwind has no variant for it.
    const mirrored = downKeys.map(
      key => `--breakpoint-${key}: ${breakpoints[key]}px;`
    )
    mirrored.forEach(declaration => expect(tailwind).toContain(declaration))
  })

  // Tailwind ships a `2xl` of its own. Anything it registers beyond this map
  // would be a breakpoint no application component or hook can switch on.
  it('leaves no breakpoint registered that this map does not define', () => {
    const registered = [
      ...tailwind.matchAll(/--breakpoint-([\w.]+):\s*([^;]+);/g),
    ]
      .filter(([, , value]) => value.trim() !== 'initial')
      .map(([, key]) => key)
    expect(registered.sort()).toEqual([...downKeys].sort())
  })
})
