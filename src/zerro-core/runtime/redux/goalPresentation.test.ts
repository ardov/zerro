import { describe, expect, it, vi } from 'vitest'
import { t } from 'i18next'
import { formatMoney } from '@/6-shared/helpers/money'
import { goalType } from '../../internal/domain/zerro/goals'
import { formatGoal } from './goalPresentation'

describe('goal presentation', () => {
  it('formats localized wording for every goal type', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-12T00:00:00Z'))

    expect(formatGoal({ type: goalType.MONTHLY, amount: 100 }, 'USD')).toBe(
      t('toWords.monthly', {
        sum: formatMoney(100, 'USD', 'ifAny'),
        ns: 'goals',
      })
    )
    expect(
      formatGoal({ type: goalType.MONTHLY_SPEND, amount: 200 }, 'USD')
    ).toBe(
      t('toWords.monthlySpend', {
        sum: formatMoney(200, 'USD', 'ifAny'),
        ns: 'goals',
      })
    )
    expect(
      formatGoal(
        { type: goalType.TARGET_BALANCE, amount: 300, end: '2027-03-01' },
        'USD'
      )
    ).toBe(
      t('toWords.targetBalance', {
        sum: formatMoney(300, 'USD', 'ifAny'),
        ns: 'goals',
      }) + ` ${t('toWords.till', { context: '3', ns: 'goals' })} 2027`
    )
    expect(
      formatGoal({ type: goalType.INCOME_PERCENT, amount: 0.25 }, 'USD')
    ).toBe(t('toWords.incomePercent', { percent: 25, ns: 'goals' }))

    vi.useRealTimers()
  })
})
