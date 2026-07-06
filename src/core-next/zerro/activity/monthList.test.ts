import { describe, expect, it } from 'vitest'
import type { TTransaction } from '6-shared/types'
import { EnvType, envId } from '../envelope-id'
import { buildMonthList } from './monthList'

describe('buildMonthList', () => {
  it('starts at first transaction month and includes one month after current', () => {
    expect(
      buildMonthList({
        transactions: [transaction({ date: '2026-01-15' })],
        budgets: {},
        currentMonth: '2026-03',
      })
    ).toEqual(['2026-01', '2026-02', '2026-03', '2026-04'])
  })

  it('extends one month after future budget month', () => {
    const foodId = envId.get(EnvType.Tag, 'food')

    expect(
      buildMonthList({
        transactions: [transaction({ date: '2026-01-15' })],
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

function transaction(patch: Partial<TTransaction>): TTransaction {
  return {
    id: 'tr',
    changed: 1,
    created: 1,
    user: 1,
    deleted: false,
    hold: null,
    date: '2026-01-10',
    income: 0,
    incomeAccount: 'cash',
    incomeInstrument: 1,
    outcome: 0,
    outcomeAccount: 'card',
    outcomeInstrument: 1,
    tag: null,
    merchant: null,
    payee: null,
    originalPayee: null,
    comment: null,
    reminderMarker: null,
    opIncome: 0,
    opIncomeInstrument: null,
    opOutcome: 0,
    opOutcomeInstrument: null,
    latitude: null,
    longitude: null,
    ...patch,
  } as TTransaction
}
