import { describe, expect, test } from 'vitest'
import { GroupBy, makeDateArray, nextGroup } from './makeDateArray'
import { parseDate, toISODate } from './utils'

describe('Conversions', () => {
  test('Equal ISO', () => {
    const start = '2022-10-24'
    expect(toISODate(parseDate(start))).toBe(start)
  })
})

describe('next group', () => {
  test('Next date', () => {
    expect(nextGroup('2022-01-01', GroupBy.Day)).toBe('2022-01-02')
    expect(nextGroup('2022-01-31', GroupBy.Day)).toBe('2022-02-01')
    expect(nextGroup('2022-12-31', GroupBy.Day)).toBe('2023-01-01')
  })
  test('Next month', () => {
    expect(nextGroup('2022-01-01', GroupBy.Month)).toBe('2022-02-01')
    expect(nextGroup('2022-01-31', GroupBy.Month)).toBe('2022-02-01')
    expect(nextGroup('2022-12-31', GroupBy.Month)).toBe('2023-01-01')
  })
  test('Next year', () => {
    expect(nextGroup('2022-01-01', GroupBy.Year)).toBe('2023-01-01')
    expect(nextGroup('2022-01-31', GroupBy.Year)).toBe('2023-01-01')
    expect(nextGroup('2022-12-31', GroupBy.Year)).toBe('2023-01-01')
  })
})

describe('makeDateArray', () => {
  test('Date', () => {
    expect(makeDateArray('2022-01-01', '2022-01-02', GroupBy.Day)).toEqual([
      '2022-01-01',
      '2022-01-02',
    ])
    expect(makeDateArray('2022-01-01', '2022-01-03', GroupBy.Day)).toEqual([
      '2022-01-01',
      '2022-01-02',
      '2022-01-03',
    ])
  })

  test('Current', () => {
    const curr = toISODate(new Date())
    expect(makeDateArray(curr, undefined, GroupBy.Day)).toEqual([curr])
  })

  test('Month', () => {
    expect(makeDateArray('2022-01-01', '2022-01-31', GroupBy.Month)).toEqual([
      '2022-01-01',
    ])
    expect(makeDateArray('2022-01-10', '2022-03-01', GroupBy.Month)).toEqual([
      '2022-01-01',
      '2022-02-01',
      '2022-03-01',
    ])
  })

  test('Year', () => {
    expect(makeDateArray('2022-01-01', '2022-12-31', GroupBy.Year)).toEqual([
      '2022-01-01',
    ])
    expect(makeDateArray('2022-01-10', '2023-03-01', GroupBy.Year)).toEqual([
      '2022-01-01',
      '2023-01-01',
    ])
  })
})
