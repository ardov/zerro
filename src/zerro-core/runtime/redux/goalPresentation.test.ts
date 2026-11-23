import { afterEach, expect, it, vi } from 'vitest'
import { i18n } from '@/6-shared/localization'
import { goalType } from '../../internal/domain/zerro/goals'
import { formatGoal } from './goalPresentation'

afterEach(() => vi.useRealTimers())

it('describes the amount, income percentage, or deadline of a goal in English', async () => {
  await i18n.changeLanguage('en')
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 6, 12, 12))

  expect(formatGoal({ type: goalType.MONTHLY, amount: 100 }, 'USD')).toBe(
    'Saving 100\u00a0$ each month'
  )
  expect(formatGoal({ type: goalType.MONTHLY_SPEND, amount: 200 }, 'USD')).toBe(
    'Need 200\u00a0$ per month'
  )
  expect(
    formatGoal(
      { type: goalType.TARGET_BALANCE, amount: 300, end: '2027-03-01' },
      'USD'
    )
  ).toBe('Want to save 300\u00a0$ by March 2027')
  expect(formatGoal({ type: goalType.INCOME_PERCENT, amount: 0.25 })).toBe(
    'Saving 25% of income'
  )
})
