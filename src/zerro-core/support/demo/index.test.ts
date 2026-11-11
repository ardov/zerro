import { afterEach, describe, expect, it, vi } from 'vitest'

import { hashJson } from '../testing/stableJson'
import { getDemoData, makeDemoDiff, makeDemoStore } from './index'
import { validateDataStore } from '../../internal/domain/zenmoney/model/validateStore'

const demoOptions = {
  now: '2026-04-15T12:00:00.000Z',
  until: '2026-03-31' as const,
  scale: 0.35,
}

describe('demo data', () => {
  afterEach(() => vi.useRealTimers())
  it.each(['en', 'ru'] as const)(
    'is deterministic for pinned %s options',
    locale => {
      expect(hashJson(makeDemoDiff({ ...demoOptions, locale }))).toBe(
        hashJson(makeDemoDiff({ ...demoOptions, locale }))
      )
    }
  )

  it('generates app-facing data through the current local day on every call', () => {
    vi.useFakeTimers()
    for (const day of [9, 10]) {
      const now = new Date(2026, 9, day, 0, 30)
      vi.setSystemTime(now)
      const diff = getDemoData()
      const dates = diff.transaction!.map(transaction => transaction.date)
      expect(dates.sort().at(-1)).toBe(
        `2026-10-${String(day).padStart(2, '0')}`
      )
      expect(diff.user?.[0].changed).toBe(now.getTime())
    }
  })

  it('honours explicitly pinned app-facing options', () => {
    expect(hashJson(getDemoData(demoOptions))).toBe(
      hashJson(makeDemoDiff(demoOptions))
    )
  })

  it('can build a normalized store for zerro-core tests', () => {
    const diff = makeDemoDiff(demoOptions)
    const store = makeDemoStore(demoOptions)

    expect(Object.keys(store.transaction)).toHaveLength(
      diff.transaction?.length || 0
    )
    expect(store.user[23880]?.login).toBe('demoAccount')
    expect(store.account['N26 EUR']?.balance).toEqual(
      diff.account?.find(account => account.id === 'N26 EUR')?.balance
    )
  })

  it('builds a connected Russian household with ruble prices and global brands', () => {
    const store = makeDemoStore({
      locale: 'ru',
      now: '2026-11-05T12:00:00Z',
      until: '2026-11-05',
    })
    expect(validateDataStore(store)).toEqual({ ok: true })
    expect(store.user[23880]).toMatchObject({ currency: 2, countryCode: 'RU' })
    expect(store.company[15693].title).toBe('Revolut')
    expect(store.tag['Продукты'].parent).toBe('Еда')

    for (const account of Object.values(store.account)) {
      expect(account.instrument).toBe(2)
      expect(account.balance).toBeGreaterThanOrEqual(0)
      if (account.company) {
        expect(store.company[account.company].countryCode).toBeNull()
      }
    }

    const transactions = Object.values(store.transaction)
    for (const transaction of transactions) {
      expect(transaction.incomeInstrument).toBe(2)
      expect(transaction.outcomeInstrument).toBe(2)
      expect(transaction.comment).toMatch(/[А-Яа-яЁё]/)
      if (transaction.income && transaction.outcome) {
        expect(transaction.income).toBe(transaction.outcome)
      }
    }
    expect(
      transactions.find(t => t.id.startsWith('groceries-supermarket:'))
    ).toMatchObject({
      merchant: 'Carrefour',
      originalPayee: 'carrefour.com',
      tag: ['Продукты'],
      outcome: 1249.9,
      outcomeAccount: 'Revolut · Зарплатный',
    })
    expect(transactions.find(t => t.id.startsWith('rent:'))?.outcome).toBe(
      45000
    )
    expect(transactions.find(t => t.id.startsWith('salary:'))?.income).toBe(
      160000
    )
  })

  it('keeps the English default independent of Russian data', () => {
    const english = makeDemoDiff(demoOptions)
    makeDemoDiff({ ...demoOptions, locale: 'ru' })
    expect(hashJson(makeDemoDiff({ ...demoOptions, locale: 'en' }))).toBe(
      hashJson(english)
    )
    expect(english.user?.[0].currency).toBe(3)
    expect(english.account?.find(a => a.id === 'Revolut EUR')?.instrument).toBe(
      3
    )
  })
})
