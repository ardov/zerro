import { describe, expect, it } from 'vitest'
import { makeTransaction } from '../../../testing/zenmoneyTestData'
import { EnvType, envId } from '../envelope-id'
import { buildMonthList } from './monthList'

describe('buildMonthList', () => {
  it('starts at first transaction month and includes one month after current', () => {
    expect(
      buildMonthList({
        transactions: [makeTransaction({ date: '2026-01-15' })],
        budgets: {},
        currentMonth: '2026-03',
      })
    ).toEqual(['2026-01', '2026-02', '2026-03', '2026-04'])
  })

  it('extends one month after future budget month', () => {
    const foodId = envId.get(EnvType.Tag, 'food')

    expect(
      buildMonthList({
        transactions: [makeTransaction({ date: '2026-01-15' })],
        budgets: {
          '2026-06': {
            [foodId]: 10,
          },
        },
        currentMonth: '2026-03',
      })
    ).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
    ])
  })
})
