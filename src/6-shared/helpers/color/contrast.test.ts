import { expect, it } from 'vitest'
import { getContrastText } from './contrast'

it.each([
  ['#000000', '#ffffff'],
  ['#ffffff', '#000000'],
  ['#607d8b', '#ffffff'],
  ['#3f51b5', '#ffffff'],
  ['#ff9800', '#000000'],
  ['#ffff8d', '#000000'],
  // Midtones where the former WCAG luminance threshold chose black.
  ['#43a047', '#ffffff'],
  ['#777', '#ffffff'],
  ['rgb(67 160 71)', '#ffffff'],
  ['rgba(67, 160, 71, 0.3)', '#ffffff'],
  ['oklch(0.23 0.02 240)', '#ffffff'],
  ['oklch(0.96 0.02 240)', '#000000'],
])('chooses the stronger APCA foreground for %s', (color, expected) => {
  expect(getContrastText(color)).toBe(expected)
})
