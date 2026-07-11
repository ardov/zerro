import { describe, expect, it } from 'vitest'

import { makeAccount } from 'core-next/testing/zenmoneyTestData'
import {
  getChangedNum,
  getLastChangeTime,
  getPendingSyncDiff,
} from './selectors'
import reducer, {
  appendClientOutboxEntry,
  prepareClientSync,
  rebaseServerInbox,
  receiveServerPatch,
  redoClientCommand,
  restorePersistedReplica,
  undoClientCommand,
} from './slice'

function applyServerPatch(
  state: ReturnType<typeof reducer> | undefined,
  patch: Parameters<typeof receiveServerPatch>[0]
) {
  return reducer(reducer(state, receiveServerPatch(patch)), rebaseServerInbox())
}

function getPendingDiff(state: ReturnType<typeof reducer>) {
  return getPendingSyncDiff({ data: state } as any)
}

function getRootState(state: ReturnType<typeof reducer>) {
  return { data: state } as any
}

describe('data patch boundaries', () => {
  it('applies canonical server patches and clears sent outbox state', () => {
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

  it('replays current and derives the transport diff from the outbox prefix', () => {
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

    expect(appended.base?.account.cash.title).toBe('Cash')
    expect(appended.current.account.cash.title).toBe('Vault')
    expect(getPendingDiff(appended)?.account?.[0].title).toBe('Vault')
    expect(getChangedNum(getRootState(appended))).toBe(1)
    expect(getLastChangeTime(getRootState(appended))).toBe(20)
    expect(appended.outboxHead).toBe(2)

    const undone = reducer(appended, undoClientCommand())
    expect(undone.current.account.cash.title).toBe('Wallet')
    expect(getPendingDiff(undone)?.account?.[0].title).toBe('Wallet')
    expect(getLastChangeTime(getRootState(undone))).toBe(10)
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
    expect(getPendingDiff(reset)).toBeUndefined()
    expect(reset.outboxHead).toBe(0)

    const redone = reducer(reset, redoClientCommand())
    expect(redone.current.account.cash.title).toBe('Wallet')
    expect(getPendingDiff(redone)?.account?.[0].title).toBe('Wallet')
    expect(redone.outboxHead).toBe(1)
  })

  it('rebases new commands over a server response without losing them', () => {
    const base = applyServerPatch(undefined, {
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const sent = {
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
      reducer(base, appendClientOutboxEntry(sent)),
      appendClientOutboxEntry(createdDuringSync)
    )
    const received = reducer(
      pending,
      receiveServerPatch({
        account: [makeAccount({ id: 'cash', title: 'Server Wallet' })],
        syncStartTime: 15,
        sentOutboxIds: [sent.id],
      })
    )

    expect(received.current.account.cash.title).toBe('Vault')
    expect(received.inbox).toBeTruthy()

    const rebased = reducer(received, rebaseServerInbox())
    expect(rebased.base?.account.cash.title).toBe('Server Wallet')
    expect(rebased.current.account.cash.title).toBe('Vault')
    expect(rebased.outbox?.map(entry => entry.id)).toEqual([
      'entry-during-sync',
    ])
    expect(rebased.outboxHead).toBe(1)
    expect(getPendingDiff(rebased)?.account?.[0].title).toBe('Vault')
    expect(rebased.inbox).toBeNull()
  })

  it('commits the applied history branch before sync by dropping redo', () => {
    const base = applyServerPatch(undefined, {
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const first = {
      id: 'entry-1',
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
    const redo = {
      ...first,
      id: 'entry-2',
      command: { type: 'account.rename', title: 'Vault' },
      intentPatch: {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      },
      appliedPatch: {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      },
      createdAt: 20,
    }
    const withRedo = reducer(
      reducer(
        reducer(base, appendClientOutboxEntry(first)),
        appendClientOutboxEntry(redo)
      ),
      undoClientCommand()
    )

    const prepared = reducer(withRedo, prepareClientSync())

    expect(prepared.outbox?.map(entry => entry.id)).toEqual(['entry-1'])
    expect(prepared.outboxHead).toBe(1)
    expect(prepared.current.account.cash.title).toBe('Wallet')
    expect(getPendingDiff(prepared)?.account?.[0].title).toBe('Wallet')
  })

  it('restores a persisted outbox only over its matching server base', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const entry = {
      id: 'entry-1',
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
    const persisted = {
      version: 1 as const,
      baseServerTimestamp: 100,
      outbox: [entry],
      outboxHead: 1,
    }

    const restored = reducer(base, restorePersistedReplica(persisted))
    expect(restored.base?.account.cash.title).toBe('Cash')
    expect(restored.current.account.cash.title).toBe('Wallet')
    expect(getPendingDiff(restored)?.account?.[0].title).toBe('Wallet')
    expect(restored.outbox).toEqual([entry])

    const stale = reducer(
      base,
      restorePersistedReplica({ ...persisted, baseServerTimestamp: 99 })
    )
    expect(stale.current.account.cash.title).toBe('Cash')
    expect(stale.outbox).toEqual([])
    expect(getPendingDiff(stale)).toBeUndefined()
  })
})
