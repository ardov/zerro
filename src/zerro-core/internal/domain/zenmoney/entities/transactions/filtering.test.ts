import { describe, expect, it } from 'vitest'
import { makeTransaction } from '../../../../../support/testing/zenmoneyTestData'
import { compileTransactionFilter, TrType } from './index'

describe('compileTransactionFilter', () => {
  it('filters search, month, account, amount, and logical conditions', () => {
    const transaction = makeTransaction({
      comment: 'Coffee shop',
      date: '2026-07-12',
      outcomeAccount: 'cash',
      outcome: 15,
    })

    expect(
      compileTransactionFilter({
        and: [
          { search: 'coffee' },
          { month: '2026-07' },
          { account: 'cash' },
          { amount: { gte: 10, lt: 20 } },
          { type: TrType.Outcome },
        ],
      })(transaction)
    ).toBe(true)
    expect(compileTransactionFilter({ search: 'tea' })(transaction)).toBe(false)
  })

  it('hides deleted transactions by default and can include them', () => {
    const transaction = makeTransaction({ deleted: true })

    expect(compileTransactionFilter()(transaction)).toBe(false)
    expect(compileTransactionFilter({ showDeleted: true })(transaction)).toBe(
      true
    )
  })

  it('supports tagged and uncategorized income/outcome transactions only', () => {
    const tagged = makeTransaction({ income: 10, tag: ['food'] })
    const uncategorized = makeTransaction({ income: 10, tag: null })
    const transfer = makeTransaction({ income: 10, outcome: 10, tag: ['food'] })

    expect(compileTransactionFilter({ tags: ['food'] })(tagged)).toBe(true)
    expect(compileTransactionFilter({ tags: ['null'] })(uncategorized)).toBe(
      true
    )
    expect(compileTransactionFilter({ tags: ['food'] })(transfer)).toBe(false)
  })
})
