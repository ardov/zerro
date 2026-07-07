import { describe, expect, it } from 'vitest'

import type { TDataStore } from '6-shared/types'
import { EnvType, envId } from '../zerro/envelope-id'
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
        populatedTags: {},
      }
    )

    expect(session.read.currentMonth()).toBe('2026-01')

    now = Date.parse('2026-02-15T12:00:00.000Z')

    expect(session.read.currentMonth()).toBe('2026-01')
  })

  it('can build headless envelopes without adapter-provided populated tags', () => {
    const nullTagId = envId.get(EnvType.Tag, null)
    const session = createZerroSession(makeEmptyData(), {
      now: () => Date.parse('2026-01-15T12:00:00.000Z'),
      uuid: () => 'test-id',
    })

    expect(session.read.envelopes()[nullTagId]).toMatchObject({
      id: nullTagId,
      entityId: 'null',
      name: 'No category',
      currency: 'USD',
    })
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
