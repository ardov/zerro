import { describe, expect, it } from 'vitest'

import { needSync } from './regularSyncPolicy'

describe('needSync', () => {
  const now = new Date('2026-07-11T12:00:00Z').getTime()
  const clean = {
    isOnline: true,
    isLoggedIn: true,
    isPending: false,
    lastSync: now - 3 * 60_000,
    isDocumentHidden: false,
    now,
  }

  it('runs the initial sync when there are no local changes', () => {
    expect(needSync({ ...clean, lastSync: 0 })).toBe(true)
  })

  it('periodically syncs a clean visible session', () => {
    expect(needSync(clean)).toBe(true)
  })

  it('does not periodically sync a clean hidden session', () => {
    expect(needSync({ ...clean, isDocumentHidden: true })).toBe(false)
  })

  it.each([{ isOnline: false }, { isLoggedIn: false }, { isPending: true }])(
    'waits when a runtime guard blocks refresh: %o',
    guard => {
      expect(needSync({ ...clean, ...guard })).toBe(false)
    }
  )

  it('waits a minute after the previous refresh', () => {
    expect(needSync({ ...clean, lastSync: now - 60_000 })).toBe(false)
    expect(needSync({ ...clean, lastSync: now - 60_001 })).toBe(true)
  })
})
