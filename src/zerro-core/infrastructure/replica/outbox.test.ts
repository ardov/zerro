import { describe, expect, it } from 'vitest'

import { makeAccount, makeStore } from '../../testing/zenmoneyTestData'
import type { TNormalizedPatch } from '../../types'
import {
  appendOutbox,
  clampOutboxHead,
  getPendingOutbox,
  replayOutbox,
  type TOutboxEntry,
} from './outbox'

function makeEntry(createdAt: number, patch: TNormalizedPatch): TOutboxEntry {
  return {
    type: 'patch',
    payload: patch,
    createdAt,
  }
}

describe('outbox operations', () => {
  const first = makeEntry(1, {
    account: [makeAccount({ id: 'cash', title: 'Wallet' })],
  })
  const second = makeEntry(2, {
    account: [makeAccount({ id: 'cash', title: 'Pocket' })],
  })
  const replacement = makeEntry(3, {
    account: [makeAccount({ id: 'cash', title: 'Vault' })],
  })

  it('clamps restored heads and lists only the command prefix', () => {
    expect(clampOutboxHead(-1, 2)).toBe(0)
    expect(clampOutboxHead(1, 2)).toBe(1)
    expect(clampOutboxHead(3, 2)).toBe(2)
    expect(getPendingOutbox([first, second], 1)).toEqual([first])
    expect(getPendingOutbox([first, second], 10)).toEqual([first, second])
  })

  it('appends after the command prefix and drops the redo tail', () => {
    expect(appendOutbox([first, second], 1, replacement)).toEqual({
      outbox: [first, replacement],
      outboxHead: 2,
    })
  })

  it('rematerializes only the command prefix through the clamped head', () => {
    const base = makeStore({
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })

    expect(replayOutbox(base, [first, second], 1).account.cash.title).toBe(
      'Wallet'
    )
    expect(replayOutbox(base, [first, second], 2).account.cash.title).toBe(
      'Pocket'
    )
  })
})
