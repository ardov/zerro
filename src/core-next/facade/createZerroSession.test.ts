import { describe, expect, it } from 'vitest'

import type { TDataStore } from '6-shared/types'
import { createZerroSession } from './createZerroSession'

describe('createZerroSession', () => {
  it('memoizes reads for the session lifetime', () => {
    let now = Date.parse('2026-01-15T12:00:00.000Z')
    const session = createZerroSession(
      makeEmptyData(),
      {
        now: () => now,
        uuid: () => 'test-id',
      },
      {
        labels: {
          defaultTagGroup: 'Categories',
          defaultAccountGroup: 'Accounts',
          defaultMerchantGroup: 'Merchants',
          defaultPayeeGroup: 'Payees',
        },
        populatedTags: {},
      }
    )

    expect(session.read.currentMonth()).toBe('2026-01')

    now = Date.parse('2026-02-15T12:00:00.000Z')

    expect(session.read.currentMonth()).toBe('2026-01')
  })
})

function makeEmptyData(): TDataStore {
  return {
    serverTimestamp: 0,
    instrument: {},
    country: {},
    company: {},
    user: {},
    merchant: {},
    account: {},
    tag: {},
    budget: {},
    reminder: {},
    reminderMarker: {},
    transaction: {},
  }
}
