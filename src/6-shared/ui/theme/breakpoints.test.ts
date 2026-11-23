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
  // A down query ends before the corresponding Tailwind variant starts.
  it('stops a `down` query short of the breakpoint it names', () => {
    expect(downKeys.length).toBeGreaterThan(0)
    downKeys.forEach(key => {
      const bound = Number(
        mediaQueryDown(key).match(/max-width:\s*([\d.]+)px/)![1]
      )
      expect(bound).toBeLessThan(breakpoints[key])
      // Keep the gap below one CSS pixel; binary rounding makes the exact fractional offset unsuitable for comparison.
      expect(breakpoints[key] - bound).toBeLessThan(1)
    })
  })

  it('matches the mirror in tailwind.css, in pixels', () => {
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
