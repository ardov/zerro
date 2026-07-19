import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeStore,
  makeUser,
} from '../../testing/zenmoneyTestData'
import type { TCommand } from '../../application/materializer'
import { DataEntity } from '../../domain/patch'
import {
  appendOutbox,
  buildOutboxTransport,
  clampOutboxHead,
  getPendingOutbox,
  replayOutbox,
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

    expect(buildOutboxTransport(base, commands, commands.length, 100)).toEqual({
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
        deletion: [{ id: 'cash', object: DataEntity.Account }],
      }),
      makeCommand(20, {
        account: [{ id: 'cash', instrument: 1, title: 'Wallet' }],
      }),
    ]

    expect(buildOutboxTransport(base, commands, commands.length, 100)).toEqual({
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
        deletion: [{ id: 'cash', object: DataEntity.Account }],
      }),
    ]

    expect(buildOutboxTransport(base, commands, commands.length, 100)).toEqual({
      deletion: [
        { id: 'cash', object: DataEntity.Account, stamp: 100, user: 1 },
      ],
    })
  })
})
