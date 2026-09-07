import { describe, expect, it } from 'vitest'
import type { TISODate } from '../primitives'
import { makeTransaction } from '../../../../support/testing/zenmoneyTestData'
import { buildMerchantUsage } from './merchantUsage'

const currentDate = '2026-01-31' as TISODate

const build = (transactions: ReturnType<typeof makeTransaction>[]) =>
  buildMerchantUsage({ transactions, currentDate, debtAccountId: 'debt' })

describe('buildMerchantUsage', () => {
  it('tells regular use from debt use and counts both', () => {
    const usage = build([
      makeTransaction({ id: 'spent', outcome: 10, merchant: 'shop' }),
      makeTransaction({
        id: 'lent',
        outcome: 20,
        outcomeAccount: 'card',
        income: 20,
        incomeAccount: 'debt',
        merchant: 'alex',
      }),
      makeTransaction({
        id: 'repaid',
        outcome: 20,
        outcomeAccount: 'debt',
        income: 20,
        incomeAccount: 'card',
        merchant: 'shop',
      }),
    ])

    expect(usage).toEqual({
      shop: { regular: true, debt: true, recentUses: 2 },
      alex: { regular: false, debt: true, recentUses: 1 },
    })
  })

  it('skips transactions without a merchant', () => {
    expect(build([makeTransaction({ outcome: 10, payee: 'Kiosk' })])).toEqual(
      {}
    )
  })

  it('counts only the uses within the last 30 days', () => {
    const usage = build([
      makeTransaction({ id: 'today', date: currentDate, merchant: 'shop' }),
      makeTransaction({ id: 'edge', date: '2026-01-01', merchant: 'shop' }),
      makeTransaction({ id: 'older', date: '2025-12-31', merchant: 'shop' }),
    ])

    expect(usage.shop).toEqual({ regular: true, debt: false, recentUses: 2 })
  })

  it('counts across a year boundary', () => {
    const usage = buildMerchantUsage({
      transactions: [
        makeTransaction({ id: 'inside', date: '2025-12-20', merchant: 'shop' }),
        makeTransaction({
          id: 'outside',
          date: '2025-12-01',
          merchant: 'shop',
        }),
      ],
      currentDate: '2026-01-05' as TISODate,
    })

    expect(usage.shop.recentUses).toBe(1)
  })

  it('collects normalized payee search terms from linked transactions', () => {
    const usage = build([
      makeTransaction({
        id: 'one',
        merchant: 'shop',
        payee: 'Amazon',
        originalPayee: 'Amazon.de*zl74v08e4',
      }),
      makeTransaction({
        id: 'two',
        merchant: 'shop',
        payee: 'Amazon',
        originalPayee: 'Amzn Mktp De Amazon.de',
      }),
    ])

    expect(usage.shop.searchTerms).toEqual({
      payee: ['amazon'],
      originalPayee: ['amazon de zl74v08e4', 'amzn mktp de amazon de'],
    })
  })
})
