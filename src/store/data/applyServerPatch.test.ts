import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it, vi } from 'vitest'
import {
  makeAccount,
  makeStore,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import reducer, {
  appendClientCommand,
  applyServerPatch,
  hydrateReplica,
  redoClientCommand,
  undoClientCommand,
} from './slice'

describe('canonical response acceptance', () => {
  it('publishes a rebased replica in one update and preserves local undo/redo', () => {
    const store = configureStore({ reducer })
    store.dispatch(
      hydrateReplica({
        rootUserId: 7,
        base: makeStore({
          serverTimestamp: 100,
          account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
        }),
        outbox: [],
      })
    )
    const rename = {
      type: 'patch' as const,
      issuedAt: 10,
      patch: { account: [{ id: 'cash', title: 'Wallet' }] },
    }
    const secondRename = {
      type: 'patch' as const,
      issuedAt: 20,
      patch: { account: [{ id: 'cash', title: 'Pocket' }] },
    }
    store.dispatch(appendClientCommand(rename))
    store.dispatch(appendClientCommand(secondRename))
    store.dispatch(undoClientCommand())
    const observed = vi.fn(() => store.getState())
    store.subscribe(observed)

    store.dispatch(
      applyServerPatch({
        serverTimestamp: 200,
        account: [makeAccount({ id: 'cash', title: 'Remote', balance: 42 })],
      })
    )

    expect(observed).toHaveBeenCalledOnce()
    const accepted = observed.mock.results[0].value
    expect(accepted.base.account.cash.title).toBe('Remote')
    expect(accepted.current.account.cash).toMatchObject({
      title: 'Wallet',
      balance: 42,
    })
    expect(accepted.current.serverTimestamp).toBe(200)
    expect(accepted.outbox).toEqual([rename])
    expect(accepted.redo).toEqual([secondRename])

    store.dispatch(redoClientCommand())
    expect(store.getState().current.account.cash.title).toBe('Pocket')
    store.dispatch(undoClientCommand())
    store.dispatch(undoClientCommand())
    expect(store.getState().current.account.cash.title).toBe('Remote')
  })
})
