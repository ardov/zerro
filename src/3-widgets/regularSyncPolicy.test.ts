import { describe, expect, it } from 'vitest'

import { needSync } from './regularSyncPolicy'

describe('needSync', () => {
  const now = new Date('2026-07-11T12:00:00Z').getTime()
  const clean = {
    isOnline: true,
    isLoggedIn: true,
    isPending: false,
    lastSync: now - 3 * 60_000,
    hasPendingChanges: false,
    regular: true,
    isDocumentHidden: false,
    now,
  }

  it('runs the initial sync when there are no local changes', () => {
    expect(needSync({ ...clean, lastSync: 0, regular: false })).toBe(true)
  })

  it('pauses every automatic sync while applied outbox entries exist', () => {
    expect(needSync({ ...clean, lastSync: 0, hasPendingChanges: true })).toBe(
      false
    )
    expect(needSync({ ...clean, hasPendingChanges: true })).toBe(false)
  })

  it('periodically syncs a clean visible session', () => {
    expect(needSync(clean)).toBe(true)
  })

  it('does not periodically sync a clean hidden session', () => {
    expect(needSync({ ...clean, isDocumentHidden: true })).toBe(false)
  })
})
