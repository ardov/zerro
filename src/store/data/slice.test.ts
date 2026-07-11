import { describe, expect, it } from 'vitest'

import { makeAccount } from 'core-next/testing/zenmoneyTestData'
import reducer, {
  appendClientOutboxEntry,
  applyServerPatch,
  redoClientCommand,
  undoClientCommand,
} from './slice'

describe('data patch boundaries', () => {
  it('applies canonical server patches and clears acknowledged outbox state', () => {
    const initial = reducer(undefined, { type: 'test/init' })
    const next = reducer(initial, applyServerPatch({ serverTimestamp: 300 }))

    expect(next.current.serverTimestamp).toBe(300)
    expect(next.outbox).toEqual([])
    expect(next.outboxHead).toBe(0)
  })

  it('replays current and diff from the applied outbox prefix', () => {
    const base = reducer(
      undefined,
      applyServerPatch({
        account: [makeAccount({ id: 'cash', title: 'Cash' })],
      })
    )
    const first = {
      id: 'entry-1',
      command: { type: 'test.patch' },
      intentPatch: {
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
      },
      appliedPatch: {
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
      },
      materializerVersion: 1,
      createdAt: 10,
    }
    const second = {
      ...first,
      id: 'entry-2',
      intentPatch: {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      },
      appliedPatch: {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      },
      createdAt: 20,
    }
    const appended = reducer(
      reducer(base, appendClientOutboxEntry(first)),
      appendClientOutboxEntry(second)
    )

    expect(appended.server?.account.cash.title).toBe('Cash')
    expect(appended.current.account.cash.title).toBe('Vault')
    expect(appended.diff?.account?.[0].title).toBe('Vault')
    expect(appended.outboxHead).toBe(2)

    const undone = reducer(appended, undoClientCommand())
    expect(undone.current.account.cash.title).toBe('Wallet')
    expect(undone.diff?.account?.[0].title).toBe('Wallet')
    expect(undone.outboxHead).toBe(1)

    const replacement = {
      ...first,
      id: 'entry-3',
      intentPatch: {
        account: [makeAccount({ id: 'cash', title: 'Pocket' })],
      },
      appliedPatch: {
        account: [makeAccount({ id: 'cash', title: 'Pocket' })],
      },
      createdAt: 30,
    }
    const branched = reducer(undone, appendClientOutboxEntry(replacement))
    expect(branched.outbox?.map(entry => entry.id)).toEqual([
      'entry-1',
      'entry-3',
    ])
    expect(branched.current.account.cash.title).toBe('Pocket')

    const reset = reducer(undone, undoClientCommand())
    expect(reset.current.account.cash.title).toBe('Cash')
    expect(reset.diff).toBeUndefined()
    expect(reset.outboxHead).toBe(0)

    const redone = reducer(reset, redoClientCommand())
    expect(redone.current.account.cash.title).toBe('Wallet')
    expect(redone.diff?.account?.[0].title).toBe('Wallet')
    expect(redone.outboxHead).toBe(1)
  })
})
