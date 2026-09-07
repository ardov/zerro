import { describe, expect, it } from 'vitest'
import type { TISODate } from '../primitives'
import { makeTransaction } from '../../../../support/testing/zenmoneyTestData'
import {
  buildMerchantUsage,
  extractWebsiteDomains,
  findWebsiteDomain,
} from './merchantUsage'

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

  it('uses the most frequent website for each merchant', () => {
    const usage = build([
      makeTransaction({
        id: 'one',
        merchant: 'shop',
        payee: 'Amazon.com*first',
        originalPayee: 'https://payments.amazon.com/order',
      }),
      makeTransaction({
        id: 'two',
        merchant: 'shop',
        payee: 'amazon.com*second',
        originalPayee: 'amazon.de',
      }),
      makeTransaction({
        id: 'three',
        merchant: 'shop',
        payee: 'shop.example.co.uk',
      }),
    ])

    expect(usage.shop.website).toEqual({
      domain: 'amazon.com',
      transactionCount: 2,
    })
  })

  it('breaks website ties alphabetically', () => {
    const usage = build([
      makeTransaction({ id: 'one', merchant: 'shop', payee: 'zebra.com' }),
      makeTransaction({ id: 'two', merchant: 'shop', payee: 'alpha.com' }),
    ])

    expect(usage.shop.website).toEqual({
      domain: 'alpha.com',
      transactionCount: 1,
    })
  })
})

describe('extractWebsiteDomains', () => {
  it.each([
    ['Amazon.de*zl74v08e4', ['amazon.de']],
    ['Amzn Mktp De Amazon.de', ['amazon.de']],
  ])('finds a domain in %s', (value, expected) => {
    expect(extractWebsiteDomains(value)).toEqual(expected)
  })

  it('finds domains in URLs and bank text without mistaking emails for sites', () => {
    expect(
      extractWebsiteDomains(
        'Amazon.com\\*fe4dg https://checkout.amazon.co.uk/order user@paypal.com'
      )
    ).toEqual(['amazon.com', 'amazon.co.uk'])
  })

  it('returns each normalized domain once', () => {
    expect(
      extractWebsiteDomains('WWW.Amazon.com and payments.amazon.com')
    ).toEqual(['amazon.com'])
  })

  it('ignores non-public domain-shaped text', () => {
    expect(extractWebsiteDomains('internal.local and sample.invalid')).toEqual(
      []
    )
  })
})

describe('findWebsiteDomain', () => {
  it('prefers payee and falls back to original payee', () => {
    expect(findWebsiteDomain('Amazon.com', 'Amazon.de')).toBe('amazon.com')
    expect(findWebsiteDomain('Amazon', 'Amazon.de*zl74v08e4')).toBe('amazon.de')
  })
})
