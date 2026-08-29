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
  // A `down` query stops 0.05px short of the breakpoint rather than at it, so
  // that `down('md')` and a `md:` utility cannot both match at 900px. This was
  // MUI's arithmetic and used to be checked against MUI; with nothing left to
  // compare against, the queries are written out, which is what catches the
  // subtraction going missing.
  it('stops a `down` query just short of the breakpoint', () => {
    expect(downKeys.map(mediaQueryDown)).toEqual([
      '(max-width: 599.95px)',
      '(max-width: 899.95px)',
      '(max-width: 1199.95px)',
      '(max-width: 1535.95px)',
    ])
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
