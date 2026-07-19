import { describe, expect, it } from 'vitest'

import { makeAccount, makeStore } from '../../testing/zenmoneyTestData'
import type { TCommand } from '../../application/materializer'
import { createZerroEngine } from './createZerroEngine'

function makeCommand(title: string, issuedAt: number): TCommand {
  return {
    type: 'patch',
    patch: { account: [{ id: 'cash', title }] },
    issuedAt,
  }
}

describe('createZerroEngine', () => {
  const base = makeStore({
    account: {
      cash: makeAccount({ id: 'cash', title: 'Cash', balance: 100 }),
    },
  })

  it('stores compiled behavior as one patch command', () => {
    const engine = createZerroEngine({
      base,
      ctx: { now: () => 100, uuid: () => 'entry-1' },
    })

    const command = engine.executeCompiled(
      { type: 'account.patch' },
      { account: [makeAccount({ id: 'cash', title: 'Wallet' })] }
    )

    expect(command).toEqual(makeCommand('Wallet', 100))
    expect(engine.getCurrent().account.cash.title).toBe('Wallet')
  })

  it('executes compilers against rematerialized current state', () => {
    const engine = createZerroEngine({
      base,
      outbox: [makeCommand('Wallet', 100)],
      outboxHead: 1,
      ctx: { now: () => 200, uuid: () => 'entry-2' },
    })

    const result = engine.execute({ type: 'account.rename' }, data => {
      expect(data.account.cash.title).toBe('Wallet')
      return { account: [makeAccount({ id: 'cash', title: 'Vault' })] }
    })

    expect(result.command).toEqual(makeCommand('Vault', 200))
    expect(engine.getCurrent().account.cash.title).toBe('Vault')
  })

  it('returns receipts without storing them in command entries', () => {
    const engine = createZerroEngine({
      base,
      ctx: { now: () => 100, uuid: () => 'entry-1' },
    })

    const result = engine.execute({ type: 'transaction.create' }, () => ({
      patch: {},
      receipt: { transactionId: 'tr-new' },
    }))

    expect(result.receipt).toEqual({ transactionId: 'tr-new' })
    expect(result.command).toEqual({
      type: 'patch',
      patch: {},
      issuedAt: 100,
    })
  })

  it('moves the head for undo and redo and drops a redo tail on append', () => {
    const engine = createZerroEngine({
      base,
      outbox: [makeCommand('Wallet', 100), makeCommand('Pocket', 200)],
      outboxHead: 2,
      ctx: { now: () => 300, uuid: () => 'entry-3' },
    })

    expect(engine.undo()).toBe(true)
    expect(engine.getCurrent().account.cash.title).toBe('Wallet')
    engine.executeCompiled(
      { type: 'account.patch' },
      { account: [makeAccount({ id: 'cash', title: 'Vault' })] }
    )

    expect(engine.getState().outbox.map(command => command.issuedAt)).toEqual([
      100, 300,
    ])
    expect(engine.redo()).toBe(false)
    expect(engine.getCurrent().account.cash.title).toBe('Vault')
  })

  it('rebuilds deterministically from persisted command state', () => {
    const first = createZerroEngine({
      base,
      outbox: [makeCommand('Wallet', 100)],
      outboxHead: 1,
      ctx: { now: () => 200, uuid: () => 'unused' },
    })
    const reloaded = createZerroEngine({
      ...first.getState(),
      ctx: { now: () => 300, uuid: () => 'unused' },
    })

    expect(reloaded.getCurrent()).toEqual(first.getCurrent())
  })
})
