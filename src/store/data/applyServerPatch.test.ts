import { describe, expect, it, vi } from 'vitest'

import { applyServerPatch } from './applyServerPatch'
import { rebaseServerInbox, receiveServerPatch } from './slice'

describe('applyServerPatch', () => {
  it('stages the canonical patch before rebasing it', () => {
    const dispatch = vi.fn()
    const patch = {
      serverTimestamp: 100,
      syncStartTime: 90,
      acknowledgedOutboxIds: ['entry-1'],
    }

    applyServerPatch(patch)(dispatch as any, vi.fn() as any, undefined)

    expect(dispatch.mock.calls).toEqual([
      [receiveServerPatch(patch)],
      [rebaseServerInbox()],
    ])
  })
})
