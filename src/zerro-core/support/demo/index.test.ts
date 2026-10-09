import { afterEach, describe, expect, it, vi } from 'vitest'

import { hashJson } from '../testing/stableJson'
import { getDemoData, makeDemoDiff, makeDemoStore } from './index'

const demoOptions = {
  now: '2026-04-15T12:00:00.000Z',
  until: '2026-03-31' as const,
  scale: 0.35,
}

describe('demo data', () => {
  afterEach(() => vi.useRealTimers())
  it('is deterministic for pinned options', () => {
    expect(hashJson(makeDemoDiff(demoOptions))).toBe(
      hashJson(makeDemoDiff(demoOptions))
    )
  })

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
    expect(store.account['Cash RUB']?.balance).toEqual(
      diff.account?.find(account => account.id === 'Cash RUB')?.balance
    )
  })
})
