import { expect, it } from 'vitest'
import { parseColorInput } from './input'

it.each([
  ['3', '#333333'],
  ['32', '#323232'],
  ['321', '#332211'],
  ['3214', '#332211'],
  ['32145', '#321450'],
  ['321456', '#321456'],
  ['321456ab', '#321456'],
  ['AbC', '#aabbcc'],
])('normalizes bare and prefixed HEX %s', (input, expected) => {
  expect(parseColorInput(input)).toBe(expected)
  expect(parseColorInput(`#${input}`)).toBe(expected)
})

it.each([
  ['rgb(100 100 100)', '#646464'],
  ['rgba(100, 100, 100, 0.2)', '#646464'],
  ['hsl(120 100% 50% / 10%)', '#00ff00'],
  ['oklch(0.6 0.1 120)', '#798940'],
  ['color(display-p3 1 0 0)', '#ff0000'],
  ['rebeccapurple', '#663399'],
  ['  #AbC  ', '#aabbcc'],
])('normalizes a CSS color and discards alpha: %s', (input, expected) => {
  expect(parseColorInput(input)).toBe(expected)
})

it.each(['', '   ', '#'])('clears an empty color: %j', input => {
  expect(parseColorInput(input)).toBeNull()
})

it.each([
  'not a color',
  '#ggg',
  '1234567',
  '123456789',
  'rgb(',
  'var(--color)',
  'rgb(NaN 1 2)',
])('ignores unrecognized input: %s', input => {
  expect(parseColorInput(input)).toBeUndefined()
})
