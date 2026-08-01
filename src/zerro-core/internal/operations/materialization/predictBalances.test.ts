import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeStore,
  makeTransaction,
  makeUser,
} from '../../../support/testing/zenmoneyTestData'
import { AccountType } from '../../domain/zenmoney/entities/accounts'
import type { TTransactionPatch } from '../../domain/zenmoney/entities/transactions/types'
import { applyPatch } from '../../domain/zenmoney/model/applyPatch'
import type { TISODate } from '../../domain/zenmoney/primitives'
import type { TDataStore } from '../../domain/zenmoney/model/store'
import { buildOutboxTransport, replayOutbox } from '../replication/outbox'
import { issuePatch, materializeCommand } from './materializeCommand'

const rootUser = makeUser({ id: 1, parent: null, currency: 2 })

/** Cash account holding `balance`, plus whatever else the case needs. */
function makeSnapshot(patch: Partial<TDataStore> = {}): TDataStore {
  return makeStore({ user: { 1: rootUser }, ...patch })
}

function balances(store: TDataStore): Record<string, number> {
  return Object.fromEntries(
    Object.values(store.account).map(account => [account.id, account.balance])
  )
}

describe('predicted account balances', () => {
  it('follows an edited expense on the outcome account', () => {
    const snapshot = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', balance: 90 }) },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          outcome: 10,
        }),
      },
    })
    const command = issuePatch(
      snapshot,
      { transaction: [{ id: 'tr', outcome: 25 }] },
      100
    )
    const patch = materializeCommand(snapshot, command)

    expect(patch.account).toEqual([{ ...snapshot.account.acc, balance: 75 }])
    expect(balances(applyPatch(snapshot, patch))).toEqual({ acc: 75 })
  })

  it('follows a created income and a created expense', () => {
    const snapshot = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', balance: 100 }) },
    })
    const draft = {
      incomeInstrument: 1,
      incomeAccount: 'acc',
      outcomeInstrument: 1,
      outcomeAccount: 'acc',
      date: '2026-01-10' as TISODate,
    }
    const created: TTransactionPatch[] = [
      { id: 'income', ...draft, income: 40, outcome: 0 },
      { id: 'expense', ...draft, income: 0, outcome: 15 },
    ]
    const command = issuePatch(snapshot, { transaction: created }, 100)

    expect(
      balances(applyPatch(snapshot, materializeCommand(snapshot, command)))
    ).toEqual({ acc: 125 })
  })

  it('recalculates both sides of a transfer and of a moved transaction', () => {
    const snapshot = makeSnapshot({
      account: {
        from: makeAccount({ id: 'from', balance: 200 }),
        to: makeAccount({ id: 'to', balance: 50 }),
        other: makeAccount({ id: 'other', balance: 300 }),
      },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          outcomeAccount: 'from',
          outcome: 30,
          incomeAccount: 'to',
          income: 30,
        }),
      },
    })

    // Moving the outcome side to another account returns the amount to `from`
    // and takes it from `other`, exactly as the server recomputes both.
    const command = issuePatch(
      snapshot,
      { transaction: [{ id: 'tr', outcomeAccount: 'other' }] },
      100
    )
    const moved = applyPatch(snapshot, materializeCommand(snapshot, command))

    expect(balances(moved)).toEqual({ from: 230, to: 50, other: 270 })
  })

  it('returns the contribution when a transaction is soft-deleted', () => {
    const snapshot = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', balance: 90 }) },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          outcome: 10,
        }),
      },
    })
    const command = issuePatch(
      snapshot,
      { transaction: [{ id: 'tr', deleted: true }] },
      100
    )

    expect(
      balances(applyPatch(snapshot, materializeCommand(snapshot, command)))
    ).toEqual({ acc: 100 })
  })

  it('returns the contribution of a row purged by the amount rule', () => {
    const snapshot = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', balance: 90 }) },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          outcome: 10,
        }),
      },
    })
    const command = issuePatch(
      snapshot,
      { transaction: [{ id: 'tr', income: 0.00001, outcome: 0.00001 }] },
      100
    )
    const patch = materializeCommand(snapshot, command)
    const next = applyPatch(snapshot, patch)

    // The purged row is gone and contributes nothing, so the balance is the
    // same as if it had been deleted outright.
    expect(patch.transaction).toBeUndefined()
    expect(next.transaction.tr).toBeUndefined()
    expect(balances(next)).toEqual({ acc: 100 })
  })

  it('predicts every account type, including ones with no starting balance', () => {
    // Deposit and loan recompute their balance from transactions like any other
    // account; only their base term reads 0. Debt recomputes too, its balance
    // just feeds no read model.
    const snapshot = makeSnapshot({
      account: {
        debt: makeAccount({ id: 'debt', type: AccountType.Debt, balance: 20 }),
        deposit: makeAccount({
          id: 'deposit',
          type: AccountType.Deposit,
          balance: 500,
        }),
        loan: makeAccount({ id: 'loan', type: AccountType.Loan, balance: 700 }),
        emoney: makeAccount({
          id: 'emoney',
          type: AccountType.Emoney,
          balance: 40,
        }),
        card: makeAccount({
          id: 'card',
          type: AccountType.Ccard,
          balance: 100,
        }),
      },
      transaction: {
        toDeposit: makeTransaction({
          id: 'toDeposit',
          outcomeAccount: 'card',
          outcome: 5,
          incomeAccount: 'deposit',
          income: 5,
        }),
        toLoan: makeTransaction({
          id: 'toLoan',
          outcomeAccount: 'card',
          outcome: 7,
          incomeAccount: 'loan',
          income: 7,
        }),
        toEmoney: makeTransaction({
          id: 'toEmoney',
          outcomeAccount: 'card',
          outcome: 9,
          incomeAccount: 'emoney',
          income: 9,
        }),
        fromDebt: makeTransaction({
          id: 'fromDebt',
          outcomeAccount: 'card',
          outcome: 3,
          incomeAccount: 'debt',
          income: 3,
        }),
      },
    })
    const command = issuePatch(
      snapshot,
      {
        transaction: [
          { id: 'toDeposit', outcome: 6, income: 6 },
          { id: 'toLoan', outcome: 8, income: 8 },
          { id: 'toEmoney', outcome: 10, income: 10 },
          { id: 'fromDebt', outcome: 4, income: 4 },
        ],
      },
      100
    )

    // Every income side gains 1; the card funding all four loses 4.
    expect(
      balances(applyPatch(snapshot, materializeCommand(snapshot, command)))
    ).toEqual({ debt: 21, deposit: 501, loan: 701, emoney: 41, card: 96 })
  })

  it('follows a changed startBalance, except where the base reads 0', () => {
    const snapshot = makeSnapshot({
      account: {
        cash: makeAccount({ id: 'cash', startBalance: 50, balance: 90 }),
        loan: makeAccount({
          id: 'loan',
          type: AccountType.Loan,
          startBalance: 1000,
          balance: 700,
        }),
        deposit: makeAccount({
          id: 'deposit',
          type: AccountType.Deposit,
          startBalance: 300,
          balance: 500,
        }),
      },
    })
    const command = issuePatch(
      snapshot,
      {
        account: [
          { id: 'cash', startBalance: 80 },
          // `startBalance` on a loan is the principal, not a balance, so the
          // server's base stays 0 and the balance must not move.
          { id: 'loan', startBalance: 1200 },
          { id: 'deposit', startBalance: 400 },
        ],
      },
      100
    )

    expect(
      balances(applyPatch(snapshot, materializeCommand(snapshot, command)))
    ).toEqual({ cash: 120, loan: 700, deposit: 500 })
  })

  it('gives a created account the balance its startBalance implies', () => {
    const snapshot = makeSnapshot()
    const command = issuePatch(
      snapshot,
      {
        account: [
          { id: 'opened', instrument: 1, title: 'Opened', startBalance: 250 },
          {
            id: 'principal',
            instrument: 1,
            title: 'Principal',
            type: AccountType.Loan,
            startBalance: 900,
          },
        ],
      },
      100
    )

    // The account factory always starts at 0 because `balance` is not writable.
    expect(
      balances(applyPatch(snapshot, materializeCommand(snapshot, command)))
    ).toEqual({ opened: 250, principal: 0 })
  })

  it('combines a created account with a transaction on it in one command', () => {
    const snapshot = makeSnapshot()
    const command = issuePatch(
      snapshot,
      {
        account: [
          { id: 'opened', instrument: 1, title: 'Opened', startBalance: 250 },
        ],
        transaction: [
          {
            id: 'spend',
            incomeInstrument: 1,
            incomeAccount: 'opened',
            outcomeInstrument: 1,
            outcomeAccount: 'opened',
            income: 0,
            outcome: 40,
            date: '2026-01-10' as TISODate,
          },
        ],
      },
      100
    )

    expect(
      balances(applyPatch(snapshot, materializeCommand(snapshot, command)))
    ).toEqual({ opened: 210 })
  })

  it('ignores a transaction pointing at an account the snapshot does not have', () => {
    const snapshot = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', balance: 100 }) },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          incomeAccount: 'gone',
          outcomeAccount: 'gone',
          outcome: 10,
        }),
      },
    })
    const command = issuePatch(
      snapshot,
      { transaction: [{ id: 'tr', outcome: 25 }] },
      100
    )
    const patch = materializeCommand(snapshot, command)

    expect(patch.account).toBeUndefined()
    expect(balances(applyPatch(snapshot, patch))).toEqual({ acc: 100 })
  })

  it('keeps a primary account change and adds the predicted balance to it', () => {
    const snapshot = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', balance: 90, title: 'Old' }) },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          outcome: 10,
        }),
      },
    })
    const command = issuePatch(
      snapshot,
      {
        account: [{ id: 'acc', title: 'New' }],
        transaction: [{ id: 'tr', outcome: 25 }],
      },
      100
    )

    expect(materializeCommand(snapshot, command).account).toEqual([
      { ...snapshot.account.acc, title: 'New', balance: 75, changed: 1000 },
    ])
  })
})

describe('predicted balances across the replica pipeline', () => {
  const snapshot = makeSnapshot({
    account: { acc: makeAccount({ id: 'acc', balance: 90 }) },
    transaction: {
      tr: makeTransaction({
        id: 'tr',
        incomeAccount: 'acc',
        outcomeAccount: 'acc',
        outcome: 10,
      }),
    },
  })
  const raiseTo = (outcome: number, issuedAt: number) =>
    issuePatch(snapshot, { transaction: [{ id: 'tr', outcome }] }, issuedAt)

  it('applies repeated writes on one field without accumulating them', () => {
    const outbox = [raiseTo(25, 100), raiseTo(40, 200)]

    // 90 + 10 - 40, not 90 - 15 - 30: each replay recomputes its own delta
    // against the snapshot it is replayed over.
    expect(balances(replayOutbox(snapshot, outbox))).toEqual({ acc: 60 })
    expect(balances(replayOutbox(snapshot, outbox.slice(0, 1)))).toEqual({
      acc: 75,
    })
  })

  it('does not double-count after the canonical balance lands in base', () => {
    const command = raiseTo(25, 100)
    // The server accepted the write and answered with its own recalculation.
    const rebased = applyPatch(snapshot, {
      account: [{ ...snapshot.account.acc, balance: 75 }],
      transaction: [{ ...snapshot.transaction.tr, outcome: 25 }],
    })

    // The command is still pending (a pull acknowledges nothing), so it replays
    // over the new base and must now be a no-op rather than another -15.
    expect(balances(replayOutbox(rebased, [command]))).toEqual({ acc: 75 })
  })

  it('never sends a predicted balance as client intent', () => {
    const transport = buildOutboxTransport(snapshot, [raiseTo(25, 100)], 400)

    expect(transport?.account).toBeUndefined()
    expect(transport?.transaction).toEqual([
      { ...snapshot.transaction.tr, outcome: 25, changed: 1001 },
    ])
  })

  it('sends a changed startBalance but not the balance it implies', () => {
    const account = makeAccount({ id: 'acc', startBalance: 50, balance: 90 })
    const base = makeSnapshot({ account: { acc: account } })
    const command = issuePatch(
      base,
      { account: [{ id: 'acc', startBalance: 80 }] },
      100
    )

    expect(buildOutboxTransport(base, [command], 400)?.account).toEqual([
      { ...account, startBalance: 80, balance: 90, changed: 1000 },
    ])
    expect(balances(replayOutbox(base, [command]))).toEqual({ acc: 120 })
  })

  it('leaves a canonical diff unmaterialized', () => {
    // A server diff already carries the recalculated account, so applying one
    // must not derive a second balance effect from its transactions.
    const canonical = {
      transaction: [{ ...snapshot.transaction.tr, outcome: 25 }],
    }

    expect(balances(applyPatch(snapshot, canonical))).toEqual({ acc: 90 })
  })
})
