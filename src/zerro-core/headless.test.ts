import { describe, expect, it } from 'vitest'

import {
  createEmptyDataStore,
  createZerroSession,
  getSyncCursor,
} from 'zerro-core/headless'

describe('zerro-core/headless', () => {
  it('resolves as a runtime source entrypoint without an app adapter', () => {
    const data = createEmptyDataStore()
    const session = createZerroSession(data, {
      now: () => Date.parse('2026-07-29T10:00:00.000Z'),
      uuid: () => 'headless-id',
    })

    expect(session.transactions.query({ clauses: [] })).toEqual([])
    expect(getSyncCursor(data.serverTimestamp)).toBe(0)
  })
})
