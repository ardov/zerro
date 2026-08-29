import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Read as text, not imported: a `?raw` import of a stylesheet comes back empty
// once Vitest's CSS handling has had it.
const read = (name: string) =>
  readFileSync(resolve(process.cwd(), 'src/6-shared/ui', name), 'utf8')

const css = read('OutlinedField.css')
const tsx = read('OutlinedField.tsx')
/** The stylesheet's comments name the constructs they warn against, so a check
 * on what the file actually declares has to read past them. */
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, '')

/** Prettier wraps a selector once it grows past the line width, so the file is
 * searched with its whitespace collapsed and the selectors stay on one line
 * here. */
const flattened = css.replace(/\s+/g, ' ')

const HOVER = '.outlined-field__group:hover .outlined-field__notch'
const FOCUS =
  '.outlined-field__group:has(:where(input, textarea):focus) .outlined-field__notch'
const ERROR = '[data-invalid] .outlined-field__group .outlined-field__notch'
const DISABLED = '[data-disabled] .outlined-field__group .outlined-field__notch'

const positionOf = (fragment: string) => {
  const at = flattened.indexOf(fragment)
  expect(at, `${fragment} is missing from OutlinedField.css`).toBeGreaterThan(
    -1
  )
  return at
}

type TWeight = [ids: number, classes: number, elements: number]

/** Specificity of a selector, for the subset of the syntax this stylesheet
 * uses: types, classes, attributes, pseudo-classes and pseudo-elements, plus
 * the functional pseudo-classes whose weights are the whole reason the focus
 * rule is written the way it is. `:where()` contributes nothing; `:has()`,
 * `:is()` and `:not()` contribute the weight of their heaviest argument. */
function specificity(selector: string): TWeight {
  const total: TWeight = [0, 0, 0]
  let rest = selector

  // Functional pseudo-classes first, so their arguments are not counted twice
  // by the flat passes below.
  for (;;) {
    const match = /:(where|is|has|not)\(/.exec(rest)
    if (!match) break
    const open = match.index + match[0].length - 1
    let depth = 0
    let close = open
    for (; close < rest.length; close++) {
      if (rest[close] === '(') depth += 1
      else if (rest[close] === ')' && (depth -= 1) === 0) break
    }
    if (match[1] !== 'where') {
      const heaviest = splitArguments(rest.slice(open + 1, close))
        .map(argument => specificity(argument))
        .sort(compare)
        .at(-1)
      if (heaviest) heaviest.forEach((value, i) => (total[i] += value))
    }
    rest = `${rest.slice(0, match.index)} ${rest.slice(close + 1)}`
  }

  const take = (pattern: RegExp) => {
    const found = rest.match(pattern)
    rest = rest.replace(pattern, ' ')
    return found ? found.length : 0
  }

  // Attributes before pseudo-classes, so a colon inside `[href="a:b"]` is not
  // read as one; pseudo-elements before pseudo-classes, so `::` is not read as
  // a `:`.
  total[1] += take(/\[[^\]]*\]/g)
  total[2] += take(/::[\w-]+/g)
  total[0] += take(/#[\w-]+/g)
  total[1] += take(/\.[\w-]+/g)
  total[1] += take(/:[\w-]+/g)
  total[2] += take(/[a-z][\w-]*/gi)

  return total
}

/** Splits a selector list on its own commas. A nested `:where(input,
 * textarea)` carries commas of its own, and splitting on those would leave
 * `textarea):focus` to be weighed as a selector. */
function splitArguments(list: string) {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth += 1
    else if (list[i] === ')') depth -= 1
    else if (list[i] === ',' && depth === 0) {
      parts.push(list.slice(start, i))
      start = i + 1
    }
  }
  parts.push(list.slice(start))
  return parts
}

const compare = (a: TWeight, b: TWeight) =>
  a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

describe('specificity', () => {
  it('reads the constructs this stylesheet is built from', () => {
    expect(specificity('.a')).toEqual([0, 1, 0])
    expect(specificity('input:focus')).toEqual([0, 1, 1])
    expect(specificity('.a:hover .b')).toEqual([0, 3, 0])
    expect(specificity('[data-invalid] .a .b')).toEqual([0, 3, 0])
    // The two that the focus rule turns on: `:where()` is free, and `:has()`
    // costs whatever its argument costs.
    expect(specificity('.a:has(input:focus) .b')).toEqual([0, 3, 1])
    expect(specificity('.a:has(:where(input):focus) .b')).toEqual([0, 3, 0])
    // The comma is the third: it belongs to the free `:where()`, not to the
    // `:has()` around it, so naming a second control costs nothing.
    expect(specificity('.a:has(:where(input, textarea):focus) .b')).toEqual([
      0, 3, 0,
    ])
  })
})

describe('outlined field border states', () => {
  // These rules all sit at the same specificity, so their order in the file is
  // the entire mechanism — and it is the reason they are not Tailwind
  // `group-*` utilities, whose order Tailwind picks (it emits `focus-within`
  // before `hover`, which would drop the focus ring on a hovered field).
  it('resolves states in order: hover, focus, error, disabled', () => {
    const hover = positionOf(HOVER)
    const focus = positionOf(FOCUS)
    const error = positionOf(ERROR)
    const disabled = positionOf(DISABLED)

    expect(hover).toBeLessThan(focus)
    expect(focus).toBeLessThan(error)
    expect(error).toBeLessThan(disabled)
  })

  // Order only decides while the weights stay level. The focus rule is the one
  // that can drift: written as the obvious `:has(input:focus)` it gains an
  // element and starts outranking the error and disabled rules under it, so a
  // field that is both focused and invalid would keep the primary border.
  it('keeps every state rule at the same weight', () => {
    const weights = [HOVER, FOCUS, ERROR, DISABLED].map(selector => [
      selector,
      specificity(selector),
    ])
    expect(weights).toEqual(weights.map(([selector]) => [selector, [0, 3, 0]]))
  })

  // A rule in the `components` layer cannot outrank a Tailwind utility, so the
  // moment a `border-*` class lands back on the notch the states above stop
  // deciding the border.
  it('owns the whole border shorthand rather than sharing it with a utility', () => {
    expect(css).toContain('border: 1px solid var(--input)')

    const notchClasses = tsx
      .split('outlined-field__notch')[1]
      .split('"')[0]
      .split(/\s+/)
    expect(notchClasses.filter(name => /^border(-|$)/.test(name))).toEqual([])
  })

  // `:focus-within` is the trap this rule exists to avoid: the group holds the
  // adornments too, so it would light the field up while the input itself is
  // not focused.
  it('keys the ring off the input rather than the whole group', () => {
    expect(declarations).not.toContain(':focus-within')
  })
})
