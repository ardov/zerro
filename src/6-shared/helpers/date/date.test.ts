import { describe, expect, test, vi } from 'vitest'
import { GroupBy, makeDateArray } from './makeDateArray'
import { parseDate, toISODate, toISOMonth } from './utils'

describe('Conversions', () => {
  test('Equal ISO', () => {
    const start = '2022-10-24'
    expect(toISODate(parseDate(start))).toBe(start)
  })
  test('to ISO date', () => {
    expect(toISODate('2000-01-01')).toBe('2000-01-01')
    expect(toISODate('2000-01')).toBe('2000-01-01')
  })
  test('to ISO month', () => {
    expect(toISOMonth('2000-01-01')).toBe('2000-01')
    expect(toISOMonth('2000-01')).toBe('2000-01')
  })
})

describe('makeDateArray', () => {
  test('includes every day across a year boundary', () => {
    expect(makeDateArray('2022-12-30', '2023-01-02', GroupBy.Day)).toEqual([
      '2022-12-30',
      '2022-12-31',
      '2023-01-01',
      '2023-01-02',
    ])
  })

  test('ends today when no end date is given', () => {
    vi.setSystemTime(new Date(2023, 0, 2, 12))
    try {
      expect(makeDateArray('2023-01-01', undefined, GroupBy.Day)).toEqual([
        '2023-01-01',
        '2023-01-02',
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  test('includes each calendar month touched by the range', () => {
    expect(makeDateArray('2022-01-01', '2022-01-31', GroupBy.Month)).toEqual([
      '2022-01-01',
    ])
    expect(makeDateArray('2022-11-10', '2023-01-01', GroupBy.Month)).toEqual([
      '2022-11-01',
      '2022-12-01',
      '2023-01-01',
    ])
  })

  test('includes each calendar year touched by the range', () => {
    expect(makeDateArray('2022-01-01', '2022-12-31', GroupBy.Year)).toEqual([
      '2022-01-01',
    ])
    expect(makeDateArray('2022-01-10', '2023-03-01', GroupBy.Year)).toEqual([
      '2022-01-01',
      '2023-01-01',
    ])
  })
})
