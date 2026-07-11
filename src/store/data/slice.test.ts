import { describe, expect, it } from 'vitest'

import { makeAccount } from 'core-next/testing/zenmoneyTestData'
import reducer, {
  appendClientOutboxEntry,
  rebaseServerInbox,
  receiveServerPatch,
  redoClientCommand,
  undoClientCommand,
} from './slice'

function applyServerPatch(
  state: ReturnType<typeof reducer> | undefined,
  patch: Parameters<typeof receiveServerPatch>[0]
) {
  return reducer(reducer(state, receiveServerPatch(patch)), rebaseServerInbox())
}

describe('data patch boundaries', () => {
  it('applies canonical server patches and clears acknowledged outbox state', () => {
    const initial = reducer(undefined, { type: 'test/init' })
    const received = reducer(
      initial,
      receiveServerPatch({ serverTimestamp: 300 })
    )
    expect(received.current.serverTimestamp).toBe(0)
    expect(received.inbox?.serverTimestamp).toBe(300)

    const next = reducer(received, rebaseServerInbox())

    expect(next.current.serverTimestamp).toBe(300)
    expect(next.outbox).toEqual([])
    expect(next.outboxHead).toBe(0)
  })

  it('replays current and diff from the applied outbox prefix', () => {
    const base = applyServerPatch(undefined, {
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
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

  it('rebases new commands over a server response without losing them', () => {
    const base = applyServerPatch(undefined, {
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const acknowledged = {
      id: 'entry-before-sync',
      command: { type: 'account.rename', title: 'Wallet' },
      intentPatch: {
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
      },
      appliedPatch: {
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
      },
      materializerVersion: 1,
      createdAt: 10,
    }
    const createdDuringSync = {
      id: 'entry-during-sync',
      command: { type: 'account.rename', title: 'Vault' },
      intentPatch: {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      },
      appliedPatch: {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      },
      materializerVersion: 1,
      createdAt: 20,
    }
    const pending = reducer(
      reducer(base, appendClientOutboxEntry(acknowledged)),
      appendClientOutboxEntry(createdDuringSync)
    )
    const received = reducer(
      pending,
      receiveServerPatch({
        account: [makeAccount({ id: 'cash', title: 'Server Wallet' })],
        syncStartTime: 15,
        acknowledgedOutboxIds: [acknowledged.id],
      })
    )

    expect(received.current.account.cash.title).toBe('Vault')
    expect(received.inbox).toBeTruthy()

    const rebased = reducer(received, rebaseServerInbox())
    expect(rebased.server?.account.cash.title).toBe('Server Wallet')
    expect(rebased.current.account.cash.title).toBe('Vault')
    expect(rebased.outbox?.map(entry => entry.id)).toEqual([
      'entry-during-sync',
    ])
    expect(rebased.outboxHead).toBe(1)
    expect(rebased.diff?.account?.[0].title).toBe('Vault')
    expect(rebased.inbox).toBeNull()
  })
})
