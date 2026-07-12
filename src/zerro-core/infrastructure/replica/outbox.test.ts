import { describe, expect, it } from 'vitest'

import { materializerVersion } from '../../application/materializer'
import { makeAccount, makeStore } from '../../testing/zenmoneyTestData'
import type { TNormalizedPatch } from '../../types'
import {
  appendOutbox,
  clampOutboxHead,
  getPendingOutbox,
  replayOutbox,
  type TOutboxEntry,
} from './outbox'

type TCommand = { type: 'account.rename'; title: string }

function makeEntry(
  id: string,
  title: string,
  patch: TNormalizedPatch
): TOutboxEntry<TCommand> {
  return {
    id,
    command: { type: 'account.rename', title },
    intentPatch: patch,
    appliedPatch: patch,
    materializerVersion,
    createdAt: Number(id.replace('entry-', '')),
  }
}

describe('outbox operations', () => {
  const first = makeEntry('entry-1', 'Wallet', {
    account: [makeAccount({ id: 'cash', title: 'Wallet' })],
  })
  const second = makeEntry('entry-2', 'Pocket', {
    account: [makeAccount({ id: 'cash', title: 'Pocket' })],
  })
  const replacement = makeEntry('entry-3', 'Vault', {
    account: [makeAccount({ id: 'cash', title: 'Vault' })],
  })

  it('clamps restored heads and lists only the applied prefix', () => {
    expect(clampOutboxHead(-1, 2)).toBe(0)
    expect(clampOutboxHead(1, 2)).toBe(1)
    expect(clampOutboxHead(3, 2)).toBe(2)
    expect(getPendingOutbox([first, second], 1)).toEqual([first])
    expect(getPendingOutbox([first, second], 10)).toEqual([first, second])
  })

  it('appends after the applied prefix and drops the redo tail', () => {
    expect(appendOutbox([first, second], 1, replacement)).toEqual({
      outbox: [first, replacement],
      outboxHead: 2,
    })
  })

  it('replays only stored applied patches through the clamped head', () => {
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
