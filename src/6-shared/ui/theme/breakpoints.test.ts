import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { appTheme } from './createTheme'
import type { TBreakpoint, TBreakpointDown } from './breakpoints'
import { breakpoints, mediaQueryDown } from './breakpoints'

const keys = Object.keys(breakpoints) as TBreakpoint[]
const downKeys = keys.filter(key => key !== 'xs') as TBreakpointDown[]

const tailwind = readFileSync(
  resolve(process.cwd(), 'src/tailwind.css'),
  'utf8'
)

describe('breakpoints', () => {
  it('is the source the MUI theme is built from', () => {
    keys.forEach(key => {
      expect(appTheme.breakpoints.values[key]).toBe(breakpoints[key])
    })
  })

  // Owned components switch on `mediaQueryDown`, MUI components switch on
  // `theme.breakpoints.down`. A drift here would leave the two libraries
  // disagreeing about the viewport by a fraction of a pixel.
  it('produces the same `down` query MUI does', () => {
    const normalize = (query: string) => query.replace(/\s+/g, '')
    downKeys.forEach(key => {
      expect(normalize(appTheme.breakpoints.down(key))).toBe(
        normalize(`@media ${mediaQueryDown(key)}`)
      )
    })
  })

  // Tailwind cannot read TypeScript, so `src/tailwind.css` restates these
  // numbers — the one place in the scheme where a value has to be changed
  // twice. Nothing else notices when only one half moves: the app keeps
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
  // is a breakpoint no MUI component and no owned hook can switch on.
  it('leaves no breakpoint registered that this map does not define', () => {
    const registered = [
      ...tailwind.matchAll(/--breakpoint-([\w.]+):\s*([^;]+);/g),
    ]
      .filter(([, , value]) => value.trim() !== 'initial')
      .map(([, key]) => key)
    expect(registered.sort()).toEqual([...downKeys].sort())
  })
})
