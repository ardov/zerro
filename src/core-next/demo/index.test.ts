import { describe, expect, it } from 'vitest'

import { hashJson } from '../testing/stableJson'
import { getDemoData, makeDemoDiff, makeDemoStore } from './index'

const demoOptions = {
  now: '2026-04-15T12:00:00.000Z',
  until: '2026-03-31' as const,
  scale: 0.35,
}

describe('demo data', () => {
  it('is deterministic for pinned options', () => {
    expect(hashJson(makeDemoDiff(demoOptions))).toBe(
      hashJson(makeDemoDiff(demoOptions))
    )
  })

  it('uses deterministic defaults for the app-facing wrapper', () => {
    expect(hashJson(getDemoData())).toBe(hashJson(getDemoData()))
  })

  it('can build a normalized store for core-next tests', () => {
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
