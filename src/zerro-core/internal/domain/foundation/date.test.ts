import { describe, expect, it } from 'vitest'
import type { TISODate } from './primitives'
import {
  differenceInCalendarMonths,
  parseDate,
  toISODate,
  toISOMonth,
  previousMonth,
  isISOMonth,
} from './date'

const isoDates = (...dates: string[]) => dates as TISODate[]

describe('month validation and arithmetic', () => {
  it.each(['2026-01', '2026-12', '2000-02'])('accepts %s', month => {
    expect(isISOMonth(month)).toBe(true)
  })
  it.each([
    '2026-00',
    '2026-13',
    '2026-1',
    'x2026-01',
    '2026-01-01',
    '',
    null,
    undefined,
    202601,
  ])('rejects %s', month => {
    expect(isISOMonth(month)).toBe(false)
  })
  it('crosses year and DST boundaries using local month starts', () => {
    expect(toISOMonth(previousMonth('2026-01'))).toBe('2025-12')
    expect(toISODate(previousMonth('2026-03-31'))).toBe('2026-02-01')
  })
})

describe('local calendar dates', () => {
  it('parses ISO dates at local midnight', () => {
    expect(parseDate('2026-05-01')).toEqual(new Date(2026, 4, 1))
    expect(parseDate('1999-12-31')).toEqual(new Date(1999, 11, 31))
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

  it('counts calendar month boundaries in either direction', () => {
    expect(differenceInCalendarMonths('2026-05-01', '2026-05-31')).toBe(0)
    expect(differenceInCalendarMonths('2026-05-01', '2025-12-15')).toBe(5)
    expect(differenceInCalendarMonths('2025-01-01', '2026-01-01')).toBe(-12)
    expect(differenceInCalendarMonths('2026-12-31', '2026-01-01')).toBe(11)
  })
})
