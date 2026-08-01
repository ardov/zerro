import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeStore,
} from '../../../support/testing/zenmoneyTestData'
import { createEmptyDataStore } from '../../domain/zenmoney/model/store'
import type { TCommand } from '../materialization'
import { acceptCanonicalPatch } from './canonical'
import { getSyncCursor } from './cursor'

function makeAccountCommand(title: string, issuedAt: number): TCommand {
  return {
    type: 'patch',
    issuedAt,
    patch: { account: [{ id: 'cash', title }] },
  }
}

describe('canonical replica operations', () => {
  it('creates independent empty normalized snapshots', () => {
    const first = createEmptyDataStore()
    const second = createEmptyDataStore()

    expect(first).toEqual(makeStore())
    expect(first).not.toBe(second)
    expect(first.account).not.toBe(second.account)
  })

  it('rebases every pending command over a refresh patch, redo included', () => {
    const pending = makeAccountCommand('Local', 10)
    const undone = makeAccountCommand('Undone', 20)
    const accepted = acceptCanonicalPatch(
      {
        base: makeStore({
          account: { cash: makeAccount({ id: 'cash', title: 'Before' }) },
        }),
        outbox: [pending],
        redo: [undone],
      },
      {
        serverTimestamp: 5000,
        account: [makeAccount({ id: 'cash', title: 'Server' })],
      }
    )

    expect(accepted.base.account.cash.title).toBe('Server')
    expect(accepted.current.account.cash.title).toBe('Local')
    expect(accepted.outbox).toEqual([pending])
    // A pull acknowledges nothing, so it commits no history branch and the
    // undone tail stays redoable over the new base.
    expect(accepted.redo).toEqual([undone])
  })

  it('acknowledges exactly the sent prefix and replays later commands', () => {
    const sent = makeAccountCommand('Sent', 10)
    const duringRequest = makeAccountCommand('During request', 20)
    const accepted = acceptCanonicalPatch(
      {
        base: makeStore({
          account: { cash: makeAccount({ id: 'cash', title: 'Before' }) },
        }),
        outbox: [sent, duringRequest],
        redo: [makeAccountCommand('Undone', 30)],
      },
      {
        serverTimestamp: 5000,
        account: [makeAccount({ id: 'cash', title: 'Canonical sent' })],
      },
      1
    )

    expect(accepted.base.account.cash.title).toBe('Canonical sent')
    expect(accepted.current.account.cash.title).toBe('During request')
    expect(accepted.outbox).toEqual([duringRequest])
    // Acknowledging a prefix commits the applied branch, so the tail goes.
    expect(accepted.redo).toEqual([])
  })

  it('derives the overlapped incremental cursor without creating a full pull', () => {
    expect(getSyncCursor(0)).toBe(0)
    expect(getSyncCursor(500)).toBe(1000)
    expect(getSyncCursor(5000)).toBe(4000)
  })
})
