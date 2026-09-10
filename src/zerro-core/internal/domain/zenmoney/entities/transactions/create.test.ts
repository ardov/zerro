import { describe, expect, it } from 'vitest'

import {
  issuePatch,
  materializeCommand,
} from '../../../../operations/materialization'
import {
  makeAccount,
  makeInstrument,
  makeMerchant,
  makeStore,
  makeTag,
  makeUser,
} from '../../../../../support/testing/zenmoneyTestData'
import { applyPatch } from '../../model/applyPatch'
import type { TDataStore } from '../../model/store'
import {
  compileCreatePosting,
  compileCreateTransfer,
  type TCreatePostingInput,
  type TCreateTransferInput,
} from './commands'

const NOW = Date.parse('2026-07-29T10:00:00.000Z')
const ctx = { now: () => NOW, uuid: () => 'new-transaction' }

function makeData(): TDataStore {
  return makeStore({
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    account: {
      debt: makeAccount({ id: 'debt', type: 'debt', instrument: 1 }),
      cash: makeAccount({ id: 'cash', instrument: 1 }),
      card: makeAccount({ id: 'card', instrument: 1 }),
      euro: makeAccount({ id: 'euro', instrument: 2 }),
    },
    instrument: {
      1: makeInstrument({ id: 1, shortTitle: 'RUB' }),
      2: makeInstrument({ id: 2, shortTitle: 'EUR' }),
    },
    tag: { food: makeTag({ id: 'food', title: 'Food' }) },
    merchant: {
      shop: makeMerchant({ id: 'shop', title: 'Shop' }),
    },
  })
}

function materialize(
  input: TCreatePostingInput | TCreateTransferInput,
  type: 'posting' | 'transfer' = 'posting'
) {
  const data = makeData()
  const compiled =
    type === 'posting'
      ? compileCreatePosting(data, input as TCreatePostingInput, ctx)
      : compileCreateTransfer(data, input as TCreateTransferInput, ctx)
  const command = issuePatch(data, compiled.patch, NOW)
  const current = applyPatch(data, materializeCommand(data, command))
  return {
    compiled,
    command,
    transaction: current.transaction[compiled.receipt.transactionId],
  }
}

describe('transaction creation compilers', () => {
  it.each(['borrowed', 'lent'] as const)(
    'creates %s in the real account currency with the selected time',
    kind => {
      const created = Date.parse('2026-07-28T09:15:00Z')
      const { transaction } = materialize({
        kind,
        accountId: 'euro',
        amount: 50,
        date: '2026-07-28',
        createdAt: created,
        payee: 'Alex',
        merchant: { id: 'shop' },
      })
      expect(transaction).toMatchObject({
        created,
        changed: NOW,
        income: 50,
        outcome: 50,
        incomeInstrument: 2,
        outcomeInstrument: 2,
        incomeAccount: kind === 'borrowed' ? 'euro' : 'debt',
        outcomeAccount: kind === 'borrowed' ? 'debt' : 'euro',
        payee: 'Alex',
        merchant: 'shop',
        tag: null,
      })
    }
  )

  it('refuses an unnamed debt', () => {
    expect(() =>
      materialize({
        kind: 'borrowed',
        accountId: 'cash',
        amount: 5,
        date: '2026-07-28',
      })
    ).toThrow('counterparty')
  })

  it('creates a categorized expense as a normalized same-account operation', () => {
    const { compiled, transaction } = materialize({
      kind: 'expense',
      accountId: 'cash',
      amount: 12.5,
      date: '2026-07-28',
      tagIds: ['food'],
      merchant: { id: 'shop' },
      payee: 'Market',
      originalPayee: 'MARKET TERMINAL 17',
      originalAmount: { amount: 14, instrumentId: 2 },
      qrCode: 'QR:receipt',
      comment: 'Lunch',
    })

    expect(compiled.receipt).toEqual({ transactionId: 'new-transaction' })
    expect(transaction).toMatchObject({
      id: 'new-transaction',
      user: 1,
      changed: NOW,
      created: NOW,
      income: 0,
      outcome: 12.5,
      incomeAccount: 'cash',
      outcomeAccount: 'cash',
      incomeInstrument: 1,
      outcomeInstrument: 1,
      tag: ['food'],
      merchant: 'shop',
      payee: 'Market',
      originalPayee: 'MARKET TERMINAL 17',
      opOutcome: 14,
      opOutcomeInstrument: 2,
      opIncome: 0,
      opIncomeInstrument: null,
      qrCode: 'QR:receipt',
      comment: 'Lunch',
      viewed: true,
    })
  })

  it('creates income and defaults omitted category details to null', () => {
    const { transaction } = materialize({
      kind: 'income',
      accountId: 'card',
      amount: 100,
      date: '2026-07-28',
    })

    expect(transaction).toMatchObject({
      income: 100,
      outcome: 0,
      incomeAccount: 'card',
      outcomeAccount: 'card',
      tag: null,
      merchant: null,
      payee: null,
      originalPayee: null,
      comment: null,
    })
  })

  it('puts original currency on the real income leg and derives original payee', () => {
    const { transaction } = materialize({
      kind: 'income',
      accountId: 'card',
      amount: 100,
      date: '2026-07-28',
      payee: 'Employer',
      originalAmount: { amount: 4, instrumentId: 2 },
    })

    expect(transaction).toMatchObject({
      originalPayee: 'Employer',
      opIncome: 4,
      opIncomeInstrument: 2,
      opOutcome: 0,
      opOutcomeInstrument: null,
    })
  })

  it('fills an explicitly null original payee from payee', () => {
    const { transaction } = materialize({
      kind: 'expense',
      accountId: 'cash',
      amount: 5,
      date: '2026-07-28',
      payee: 'Visible name',
      originalPayee: null,
    })

    expect(transaction.originalPayee).toBe('Visible name')
  })

  it('defaults a same-instrument transfer income to its outcome', () => {
    const { transaction } = materialize(
      {
        fromAccountId: 'cash',
        toAccountId: 'card',
        sent: 50,
        date: '2026-07-28',
      },
      'transfer'
    )

    expect(transaction).toMatchObject({
      outcome: 50,
      income: 50,
      outcomeAccount: 'cash',
      incomeAccount: 'card',
      outcomeInstrument: 1,
      incomeInstrument: 1,
    })
  })

  it('requires and preserves both sides of a cross-instrument transfer', () => {
    const { transaction } = materialize(
      {
        fromAccountId: 'cash',
        toAccountId: 'euro',
        sent: 120,
        received: 3,
        createdAt: NOW - 3600000,
        date: '2026-07-28',
      },
      'transfer'
    )

    expect(transaction).toMatchObject({
      outcome: 120,
      income: 3,
      created: NOW - 3600000,
      outcomeInstrument: 1,
      incomeInstrument: 2,
    })
  })

  it('rejects invalid references and amounts', () => {
    expect(() =>
      compileCreatePosting(
        makeData(),
        {
          kind: 'expense',
          accountId: 'missing',
          amount: 1,
          date: '2026-07-28',
        },
        ctx
      )
    ).toThrow('Transaction account not found: missing')

    expect(() =>
      materialize({
        kind: 'expense',
        accountId: 'cash',
        amount: Number.NaN,
        date: '2026-07-28',
      })
    ).toThrow('finite positive')

    expect(() =>
      materialize({
        kind: 'expense',
        accountId: 'cash',
        amount: 1,
        date: '2026-07-28',
        tagIds: ['missing'],
      })
    ).toThrow('Transaction tag not found: missing')

    expect(() =>
      materialize({
        kind: 'expense',
        accountId: 'cash',
        amount: 1,
        date: '2026-07-28',
        originalAmount: { amount: 2, instrumentId: 999 },
      })
    ).toThrow('Transaction instrument not found: 999')

    expect(() =>
      materialize(
        {
          fromAccountId: 'cash',
          toAccountId: 'cash',
          sent: 1,
          date: '2026-07-28',
        },
        'transfer'
      )
    ).toThrow('Transfer accounts must be different')

    expect(() =>
      materialize(
        {
          fromAccountId: 'cash',
          toAccountId: 'euro',
          sent: 1,
          date: '2026-07-28',
        },
        'transfer'
      )
    ).toThrow('Cross-instrument transfer requires income amount')
  })

  it('requires a root user before creating an operation', () => {
    const data = makeData()
    data.user = {}

    expect(() =>
      compileCreatePosting(
        data,
        {
          kind: 'income',
          accountId: 'cash',
          amount: 1,
          date: '2026-07-28',
        },
        ctx
      )
    ).toThrow('Cannot create transaction without root user')
  })
})
