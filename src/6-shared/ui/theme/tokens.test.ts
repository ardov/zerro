import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { themeTokensCss } from './tokens'

/** What the theme emits and what Tailwind exposes have to stay in step, and
 * neither half notices on its own when they stop being.
 *
 * None of these assertions knows a colour, a radius or a shadow. They are the
 * kind that survives the palette being replaced wholesale: what they pin is
 * that every token has somewhere to be used from, that nothing is exposed that
 * no longer exists, and that the two schemes declare the same names. A test
 * that pinned the values instead would fail on the first deliberate change and
 * teach nothing. */
const tailwind = readFileSync(
  resolve(process.cwd(), 'src/tailwind.css'),
  'utf8'
)

/** One flat `:root` or `:root.dark` block. `[^}]*` is deliberate rather than
 * lazy: it cannot read a nested rule, and the first assertion below is what
 * turns that into a failure instead of a silent gap. */
const BLOCK = /(:root(?:\.dark)?)\{([^}]*)\}/g

const parsed = [...themeTokensCss.matchAll(BLOCK)]
const blocks = Object.fromEntries(
  parsed.map(([, selector, body]) => [
    selector,
    [...body.matchAll(/(--[\w-]+):/g)].map(([, name]) => name),
  ])
)
const light = blocks[':root']
const dark = blocks[':root.dark']

/** `var(--x)` and `var(--x, fallback)`, and neither `var(--x-y)`. */
const references = (css: string) =>
  new Set([...css.matchAll(/var\((--[\w-]+)\s*[,)]/g)].map(([, name]) => name))

/** Tokens a stylesheet or a call site reads directly instead of through a
 * Tailwind counterpart. Each one is a decision, which is why they are listed
 * rather than pattern-matched: adding a token that only works as
 * `[var(--whatever)]` means editing this list, and that is the moment to ask
 * whether it wants an `@utility` instead.
 *
 * The switch track opacity is deliberately read as an arbitrary value because
 * it differs between color schemes and is not a color token. */
const READ_DIRECTLY = ['--switch-track-opacity']

describe('theme tokens and their Tailwind counterparts', () => {
  it('reads the whole of what the theme emits', () => {
    // Everything below is about the names inside these two blocks, so a block
    // the regex cannot see — a `@media`, a nested rule, a selector spelled
    // some other way — would drop its tokens out of every assertion without
    // failing one. `Object.fromEntries` would also quietly keep only the last
    // of two blocks sharing a selector. Both are caught here: the selectors
    // are the two expected ones, in order, and removing them leaves nothing.
    expect(parsed.map(([, selector]) => selector)).toEqual([
      ':root',
      ':root.dark',
    ])
    expect(themeTokensCss.replace(BLOCK, '').trim()).toBe('')
  })

  it('gives every token a counterpart, or names it as read directly', () => {
    const exposed = references(tailwind)
    const uncovered = [...new Set([...light, ...dark])].filter(
      token => !exposed.has(token)
    )
    expect(uncovered.sort()).toEqual([...READ_DIRECTLY].sort())
  })

  it('exposes no token the theme has stopped emitting', () => {
    // The reverse direction, and the one a palette change actually breaks:
    // drop `--elevation-24` from the theme and `shadow-elevation-24` stays a
    // utility that resolves to nothing, on every element that still asks for
    // it. Tailwind's own variables are the ones `tailwind.css` declares itself.
    const declared = new Set(
      [...tailwind.matchAll(/^\s*(--[\w-]+):/gm)].map(([, name]) => name)
    )
    const emitted = new Set([...light, ...dark])
    const dangling = [...references(tailwind)].filter(
      token => !declared.has(token) && !emitted.has(token)
    )
    expect(dangling).toEqual([])
  })

  it('declares the same names in both schemes', () => {
    // Everything the theme emits is a palette value now, and a palette value
    // belongs to both schemes or to neither: a name only one of them declares
    // is a typo, or a token the other scheme cannot read. The check runs both
    // ways because the scheme-independent constants that used to make it
    // one-way — radius, elevations, stacking levels — are declared in
    // `tailwind.css` instead, where they do not depend on a mounted provider.
    expect(dark.filter(token => !light.includes(token))).toEqual([])
    expect(light.filter(token => !dark.includes(token))).toEqual([])
    expect(dark.length).toBeGreaterThan(0)
  })
})
