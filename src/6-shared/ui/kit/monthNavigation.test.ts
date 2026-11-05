import { describe, expect, it } from 'vitest'
import { nextMonth } from './monthNavigation'
import type { TISOMonth } from '@/6-shared/types'

describe('month grid navigation', () => {
  it.each<[TISOMonth, string, TISOMonth | null]>([
    ['2030-05', 'ArrowLeft', '2030-04'],
    ['2030-05', 'ArrowRight', '2030-06'],
    ['2030-05', 'ArrowUp', '2030-02'],
    ['2030-05', 'ArrowDown', '2030-08'],
    ['2030-02', 'ArrowUp', null],
    ['2030-11', 'ArrowDown', null],
    ['2030-03', 'ArrowRight', '2031-01'],
    ['2030-04', 'ArrowLeft', '2029-06'],
  ])('%s + %s → %s', (from, key, expected) => {
    expect(nextMonth(from, key)).toBe(expected)
  })
  it('respects inclusive bounds within and across year pages', () => {
    const bounds = { minMonth: '2030-03', maxMonth: '2031-02' } as const
    expect(nextMonth('2030-06', 'ArrowUp', bounds)).toBe('2030-03')
    expect(nextMonth('2030-03', 'ArrowLeft', bounds)).toBeNull()
    expect(nextMonth('2030-01', 'ArrowLeft', bounds)).toBeNull()
    expect(nextMonth('2030-12', 'ArrowRight', bounds)).toBe('2031-02')
    expect(nextMonth('2031-01', 'ArrowLeft', bounds)).toBe('2030-03')
    expect(nextMonth('2031-02', 'ArrowRight', bounds)).toBeNull()
  })
})
