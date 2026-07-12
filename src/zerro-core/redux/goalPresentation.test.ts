import { describe, expect, it, vi } from 'vitest'
import { goalToWords } from '5-entities/goal/shared/helpers'
import { goalType } from '../domain/zerro/goals'
import { formatGoal } from './goalPresentation'

describe('goal presentation', () => {
  it('preserves localized legacy wording for every goal type', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-12T00:00:00Z'))

    const goals = [
      { type: goalType.MONTHLY, amount: 100 },
      { type: goalType.MONTHLY_SPEND, amount: 200 },
      { type: goalType.TARGET_BALANCE, amount: 300, end: '2027-03-01' },
      { type: goalType.INCOME_PERCENT, amount: 0.25 },
    ] as const

    goals.forEach(goal => {
      expect(formatGoal(goal, 'USD')).toBe(goalToWords(goal, 'USD'))
    })

    vi.useRealTimers()
  })
})
