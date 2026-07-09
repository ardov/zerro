import { describe, expect, it } from 'vitest'
import {
  differenceInCalendarMonths as differenceInCalendarMonthsFNS,
  parseISO,
} from 'date-fns'
import type { TISODate } from '../zenmoney/primitives'
import { differenceInCalendarMonths, parseDate, toISODate } from './date'

const isoDates = (...dates: string[]) => dates as TISODate[]

// The internal date helpers replaced date-fns. These tests pin the behaviors
// that are easy to get wrong without it.
describe('core date helpers vs date-fns', () => {
  it('parses date-only ISO strings as LOCAL midnight, like parseISO', () => {
    for (const iso of isoDates('2026-05-01', '2000-01-01', '1999-12-31')) {
      expect(parseDate(iso).getTime()).toBe(parseISO(iso).getTime())
      expect(parseDate(iso).getHours()).toBe(0)
    }
  })

  it('parses ISO month strings as the first of the month, local time', () => {
    const d = parseDate('2026-05')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(4)
    expect(d.getDate()).toBe(1)
    expect(d.getHours()).toBe(0)
  })

  it('round-trips through toISODate across DST-adjacent dates', () => {
    for (const iso of isoDates('2026-03-29', '2026-10-25', '2026-01-01')) {
      expect(toISODate(parseDate(iso))).toBe(iso)
    }
  })

  it('matches date-fns differenceInCalendarMonths', () => {
    const cases: Array<[TISODate, TISODate]> = [
      ['2026-05-01', '2026-05-31'],
      ['2026-05-01', '2025-12-15'],
      ['2025-01-01', '2026-01-01'],
      ['2026-12-31', '2026-01-01'],
    ]
    for (const [a, b] of cases) {
      expect(differenceInCalendarMonths(a, b)).toBe(
        differenceInCalendarMonthsFNS(parseDate(a), parseDate(b))
      )
    }
  })
})
