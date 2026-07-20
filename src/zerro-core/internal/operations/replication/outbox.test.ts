import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeStore,
  makeUser,
} from '../../../support/testing/zenmoneyTestData'
import type { TCommand } from '../materialization'
import {
  appendOutbox,
  buildOutboxTransport,
  redoOutbox,
  replayOutbox,
  undoOutbox,
} from './outbox'

function makeCommand(issuedAt: number, patch: TCommand['patch']): TCommand {
  return {
    type: 'patch',
    patch,
    issuedAt,
  }
}

describe('outbox operations', () => {
  const first = makeCommand(1, {
    account: [makeAccount({ id: 'cash', title: 'Wallet' })],
  })
  const second = makeCommand(2, {
    account: [makeAccount({ id: 'cash', title: 'Pocket' })],
  })
  const replacement = makeCommand(3, {
    account: [makeAccount({ id: 'cash', title: 'Vault' })],
  })

  it('moves commands between the durable outbox and session redo stack', () => {
    const undone = undoOutbox([first, second], [])
    expect(undone).toEqual({ outbox: [first], redo: [second] })
    expect(redoOutbox(undone.outbox, undone.redo)).toEqual({
      outbox: [first, second],
      redo: [],
    })
  })

  it('appends to the durable outbox and drops the redo stack', () => {
    expect(appendOutbox([first], replacement)).toEqual({
      outbox: [first, replacement],
      redo: [],
    })
  })

  it('rematerializes the durable outbox', () => {
    const base = makeStore({
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })

    expect(replayOutbox(base, [first]).account.cash.title).toBe('Wallet')
    expect(replayOutbox(base, [first, second]).account.cash.title).toBe(
      'Pocket'
    )
  })

  it('builds one final full transport entity from repeated primary intent', () => {
    const base = makeStore({
      account: {
        cash: makeAccount({
          id: 'cash',
          changed: 5000,
          title: 'Cash',
          inBalance: false,
        }),
      },
    })
    const commands = [
      makeCommand(10, { account: [{ id: 'cash', title: 'Wallet' }] }),
      makeCommand(20, { account: [{ id: 'cash', inBalance: true }] }),
    ]

    expect(buildOutboxTransport(base, commands, 100)).toEqual({
      account: [
        {
          ...base.account.cash,
          title: 'Wallet',
          inBalance: true,
          changed: 7000,
        },
      ],
    })
  })

  it('keeps only the final recreation when deletion precedes an upsert', () => {
    const base = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    const commands = [
      makeCommand(10, {
        deletion: [{ id: 'cash', object: 'account' }],
      }),
      makeCommand(20, {
        account: [{ id: 'cash', instrument: 1, title: 'Wallet' }],
      }),
    ]

    expect(buildOutboxTransport(base, commands, 100)).toEqual({
      account: [
        expect.objectContaining({
          id: 'cash',
          title: 'Wallet',
          changed: 100,
        }),
      ],
    })
  })

  it('keeps only the final deletion when it follows an entity patch', () => {
    const base = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    const commands = [
      makeCommand(10, { account: [{ id: 'cash', title: 'Wallet' }] }),
      makeCommand(20, {
        deletion: [{ id: 'cash', object: 'account' }],
      }),
    ]

    expect(buildOutboxTransport(base, commands, 100)).toEqual({
      deletion: [{ id: 'cash', object: 'account', stamp: 100, user: 1 }],
    })
  })
})
