import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeReminder,
  makeStore,
  makeTransaction,
  makeUser,
} from '../../../support/testing/zenmoneyTestData'
import { materializeCommand, type TCommand } from '../materialization'
import {
  appendOutbox,
  buildOutboxTransport,
  parseCommandOutbox,
  redoOutbox,
  replayOutbox,
  stageCompiledCommand,
  undoOutbox,
  undoOutboxTo,
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

  it('validates durable command arrays and stages one compiled command', () => {
    const base = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    })
    const staged = stageCompiledCommand(
      base,
      [],
      {
        patch: {
          account: [{ id: 'cash', instrument: 1, title: 'Wallet' }],
        },
        receipt: { accountId: 'cash' },
      },
      1_000
    )

    expect(staged.outbox).toHaveLength(1)
    expect(staged.current.account.cash.title).toBe('Wallet')
    expect(parseCommandOutbox(staged.outbox)).toEqual(staged.outbox)
    expect(() =>
      parseCommandOutbox([{ type: 'patch', issuedAt: 1, patch: { nope: [] } }])
    ).toThrow('patch.nope is invalid')
  })

  it('drops a label it cannot read instead of failing the command', () => {
    const patch = { account: [makeAccount({ id: 'cash', title: 'Wallet' })] }
    const parsed = parseCommandOutbox([
      { type: 'patch', issuedAt: 1, patch, label: { verb: 'budget-set' } },
      { type: 'patch', issuedAt: 2, patch, label: { verb: 'from-the-future' } },
      { type: 'patch', issuedAt: 3, patch, label: 'nonsense' },
      {
        type: 'patch',
        issuedAt: 4,
        patch,
        label: { verb: 'goal-set', args: { id: 'tag#food', name: 5 } },
      },
    ])

    // A label is decoration over unsent work: losing the decoration is fine,
    // losing the command is not.
    expect(parsed.map(command => command.label)).toEqual([
      { verb: 'budget-set' },
      undefined,
      undefined,
      { verb: 'goal-set', args: { id: 'tag#food' } },
    ])
    expect(parsed).toHaveLength(4)
    expect(parsed.every(command => command.patch === patch)).toBe(true)
  })

  it('keeps the label out of materialization and transport', () => {
    const base = makeStore({
      serverTimestamp: 1_000,
      account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    })
    const patch = { account: [{ id: 'cash', title: 'Wallet' }] }
    const plain = makeCommand(2_000, patch)
    const labeled: TCommand = {
      ...plain,
      label: { verb: 'envelope-renamed', args: { id: 'x', name: 'Food' } },
    }

    // Inert by contract: a label may never change what reaches the server.
    expect(materializeCommand(base, labeled)).toEqual(
      materializeCommand(base, plain)
    )
    expect(buildOutboxTransport(base, [labeled], 3_000)).toEqual(
      buildOutboxTransport(base, [plain], 3_000)
    )
    expect(replayOutbox(base, [labeled])).toEqual(replayOutbox(base, [plain]))
  })

  it('moves commands between the durable outbox and session redo stack', () => {
    const undone = undoOutbox([first, second], [])
    expect(undone).toEqual({ outbox: [first], redo: [second] })
    expect(redoOutbox(undone.outbox, undone.redo)).toEqual({
      outbox: [first, second],
      redo: [],
    })
  })

  it('undoes to a position in one step, redoable in the same order as sequential undos', () => {
    const stepwise = undoOutbox(
      undoOutbox([first, second, replacement], []).outbox,
      undoOutbox([first, second, replacement], []).redo
    )
    const batched = undoOutboxTo([first, second, replacement], [], 1)

    expect(batched).toEqual({ outbox: [first], redo: [replacement, second] })
    expect(batched).toEqual(stepwise)
    expect(redoOutbox(batched.outbox, batched.redo)).toEqual({
      outbox: [first, second],
      redo: [replacement],
    })
  })

  it('rejects an out-of-range undo target', () => {
    expect(() => undoOutboxTo([first], [], -1)).toThrow(
      'Outbox undo target is out of range'
    )
    expect(() => undoOutboxTo([first], [], 2)).toThrow(
      'Outbox undo target is out of range'
    )
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

  it('predicts the verified purge locally while still sending the write', () => {
    const base = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          changed: 5000,
          incomeAccount: 'cash',
          outcomeAccount: 'cash',
          outcome: 25,
        }),
      },
    })
    const purge = makeCommand(10, {
      transaction: [{ id: 'tr', income: 0.00001, outcome: 0.00001 }],
    })

    // Local state matches what the server will confirm: the row is gone, so
    // showing deleted transactions cannot surface the temporary tiny transfer.
    expect(replayOutbox(base, [purge]).transaction).toEqual({})

    // The request still carries the exact amount write, which is what makes
    // ZenMoney purge the verified row and answer with a real tombstone.
    expect(buildOutboxTransport(base, [purge], 100)).toEqual({
      transaction: [
        {
          ...base.transaction.tr,
          income: 0.00001,
          outcome: 0.00001,
          changed: 6000,
        },
      ],
    })

    // Undo replays the surviving outbox over `base`, which still holds the
    // original entity, so the predicted purge reverses itself.
    expect(
      replayOutbox(base, undoOutbox([purge], []).outbox).transaction
    ).toEqual(base.transaction)
  })

  it('omits a locally created transaction that the outbox soft-deletes', () => {
    const base = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      transaction: {
        old: makeTransaction({ id: 'old', changed: 5000, outcome: 25 }),
      },
    })
    const commands = [
      makeCommand(10, {
        transaction: [
          {
            id: 'new',
            date: '2026-01-01',
            incomeInstrument: 1,
            incomeAccount: 'cash',
            outcomeInstrument: 1,
            outcomeAccount: 'cash',
            outcome: 10,
          },
        ],
      }),
      makeCommand(20, { transaction: [{ id: 'new', deleted: true }] }),
      makeCommand(30, { transaction: [{ id: 'old', deleted: true }] }),
    ]

    // `new` never reached the server, so its tombstone stays local; `old` is a
    // row ZenMoney already holds and must learn about the soft delete.
    expect(buildOutboxTransport(base, commands, 100)).toEqual({
      transaction: [{ ...base.transaction.old, deleted: true, changed: 6000 }],
    })
  })

  it('drops a locally created transaction that leaves nothing to send', () => {
    const base = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    })
    const commands = [
      makeCommand(10, {
        transaction: [
          {
            id: 'new',
            date: '2026-01-01',
            incomeInstrument: 1,
            incomeAccount: 'cash',
            outcomeInstrument: 1,
            outcomeAccount: 'cash',
            outcome: 10,
          },
        ],
      }),
      makeCommand(20, { transaction: [{ id: 'new', deleted: true }] }),
    ]

    expect(buildOutboxTransport(base, commands, 100)).toBeUndefined()
  })

  it('omits the deletion of an entity the outbox itself created', () => {
    const base = makeStore({
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      reminder: { old: makeReminder({ id: 'old' }) },
    })
    const commands = [
      makeCommand(10, {
        reminder: [
          { id: 'new', incomeAccount: 'cash', outcomeAccount: 'card' },
        ],
      }),
      makeCommand(20, { deletion: [{ id: 'new', object: 'reminder' }] }),
      makeCommand(30, { deletion: [{ id: 'old', object: 'reminder' }] }),
    ]

    // A `deletion` object for `new` would name an id the server has never seen.
    expect(buildOutboxTransport(base, commands, 100)).toEqual({
      deletion: [{ id: 'old', object: 'reminder', stamp: 100, user: 1 }],
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
