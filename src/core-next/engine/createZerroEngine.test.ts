import { describe, expect, it } from 'vitest'

import { makeAccount, makeStore } from '../testing/zenmoneyTestData'
import { createZerroEngine } from './createZerroEngine'

describe('createZerroEngine', () => {
  it('executes compiled patches and exposes current state', () => {
    const engine = createZerroEngine({
      base: makeStore({
        account: {
          cash: makeAccount({ id: 'cash', title: 'Cash', balance: 100 }),
        },
      }),
      ctx: {
        now: () => 100,
        uuid: () => 'entry-1',
      },
    })

    const entry = engine.executeCompiled(
      { type: 'account.patch', payload: { id: 'cash' } },
      {
        account: [
          makeAccount({ id: 'cash', title: 'Wallet', balance: 125 }),
        ],
      }
    )

    expect(entry).toMatchObject({
      id: 'entry-1',
      createdAt: 100,
      command: { type: 'account.patch' },
    })
    expect(engine.getCurrent().account.cash.title).toBe('Wallet')
    expect(engine.getCurrent().account.cash.balance).toBe(125)
    expect(engine.getPendingOutbox()).toEqual([entry])
  })

  it('moves outboxHead for undo and redo without inverse patches', () => {
    const engine = createZerroEngine({
      base: makeStore({
        account: {
          cash: makeAccount({ id: 'cash', title: 'Cash', balance: 100 }),
        },
      }),
      outbox: [
        {
          id: 'entry-1',
          command: { type: 'account.patch', title: 'Wallet' },
          patch: {
            account: [makeAccount({ id: 'cash', title: 'Wallet' })],
          },
          createdAt: 100,
        },
      ],
      outboxHead: 1,
      ctx: {
        now: () => 200,
        uuid: () => 'entry-2',
      },
    })

    expect(engine.getCurrent().account.cash.title).toBe('Wallet')
    expect(engine.undo()).toBe(true)
    expect(engine.getCurrent().account.cash.title).toBe('Cash')
    expect(engine.undo()).toBe(false)
    expect(engine.redo()).toBe(true)
    expect(engine.getCurrent().account.cash.title).toBe('Wallet')
    expect(engine.redo()).toBe(false)
  })

  it('drops redo tail when executing after undo', () => {
    const engine = createZerroEngine({
      base: makeStore({
        account: {
          cash: makeAccount({ id: 'cash', title: 'Cash', balance: 100 }),
        },
      }),
      outbox: [
        {
          id: 'entry-1',
          command: { type: 'account.patch', title: 'Wallet' },
          patch: {
            account: [makeAccount({ id: 'cash', title: 'Wallet' })],
          },
          createdAt: 100,
        },
        {
          id: 'entry-2',
          command: { type: 'account.patch', title: 'Pocket' },
          patch: {
            account: [makeAccount({ id: 'cash', title: 'Pocket' })],
          },
          createdAt: 200,
        },
      ],
      outboxHead: 2,
      ctx: {
        now: () => 300,
        uuid: () => 'entry-3',
      },
    })

    expect(engine.undo()).toBe(true)
    engine.executeCompiled(
      { type: 'account.patch', title: 'Vault' },
      {
        account: [makeAccount({ id: 'cash', title: 'Vault' })],
      }
    )

    const state = engine.getState()
    expect(state.outbox.map(entry => entry.id)).toEqual(['entry-1', 'entry-3'])
    expect(state.outboxHead).toBe(2)
    expect(engine.getCurrent().account.cash.title).toBe('Vault')
  })

  it('rebuilds the same current state from persisted outbox state', () => {
    const base = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', balance: 100 }),
      },
    })
    const outbox = [
      {
        id: 'entry-1',
        command: { type: 'account.patch', title: 'Wallet' },
        patch: {
          account: [makeAccount({ id: 'cash', title: 'Wallet' })],
        },
        createdAt: 100,
      },
    ]

    const first = createZerroEngine({
      base,
      outbox,
      outboxHead: 1,
      ctx: { now: () => 200, uuid: () => 'unused' },
    })
    const reloaded = createZerroEngine({
      ...first.getState(),
      ctx: { now: () => 300, uuid: () => 'unused' },
    })

    expect(reloaded.getCurrent()).toEqual(first.getCurrent())
  })

  it('clamps restored outboxHead to the available outbox range', () => {
    const engine = createZerroEngine({
      base: makeStore(),
      outbox: [],
      outboxHead: 10,
      ctx: {
        now: () => 100,
        uuid: () => 'unused',
      },
    })

    expect(engine.getState().outboxHead).toBe(0)
  })
})
