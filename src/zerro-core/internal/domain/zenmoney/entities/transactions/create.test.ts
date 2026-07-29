import { describe, expect, it } from 'vitest'

import {
  issuePatch,
  materializeCommand,
} from '../../../../operations/materialization'
import {
  makeAccount,
  makeMerchant,
  makeStore,
  makeTag,
  makeUser,
} from '../../../../../support/testing/zenmoneyTestData'
import { applyPatch } from '../../model/applyPatch'
import type { TDataStore } from '../../model/store'
import {
  compileCreateTransaction,
  type TCreateTransactionInput,
} from './commands'

const NOW = Date.parse('2026-07-29T10:00:00.000Z')
const ctx = { now: () => NOW, uuid: () => 'new-transaction' }

function makeData(): TDataStore {
  return makeStore({
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    account: {
      cash: makeAccount({ id: 'cash', instrument: 1 }),
      card: makeAccount({ id: 'card', instrument: 1 }),
      euro: makeAccount({ id: 'euro', instrument: 2 }),
    },
    tag: { food: makeTag({ id: 'food', title: 'Food' }) },
    merchant: {
      shop: makeMerchant({ id: 'shop', title: 'Shop' }),
    },
  })
}

function materialize(input: TCreateTransactionInput) {
  const data = makeData()
  const compiled = compileCreateTransaction(data, input, ctx)
  const command = issuePatch(data, compiled.patch, NOW)
  const current = applyPatch(data, materializeCommand(data, command))
  return {
    compiled,
    command,
    transaction: current.transaction[compiled.receipt.transactionId],
  }
}

describe('compileCreateTransaction', () => {
  it('creates a categorized expense as a normalized same-account operation', () => {
    const { compiled, transaction } = materialize({
      kind: 'expense',
      accountId: 'cash',
      amount: 12.5,
      date: '2026-07-28',
      tagIds: ['food'],
      merchantId: 'shop',
      payee: 'Market',
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
      comment: null,
    })
  })

  it('defaults a same-instrument transfer income to its outcome', () => {
    const { transaction } = materialize({
      kind: 'transfer',
      outcomeAccountId: 'cash',
      incomeAccountId: 'card',
      outcome: 50,
      date: '2026-07-28',
    })

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
    const { transaction } = materialize({
      kind: 'transfer',
      outcomeAccountId: 'cash',
      incomeAccountId: 'euro',
      outcome: 120,
      income: 3,
      date: '2026-07-28',
    })

    expect(transaction).toMatchObject({
      outcome: 120,
      income: 3,
      outcomeInstrument: 1,
      incomeInstrument: 2,
    })
  })

  it('rejects invalid references and amounts', () => {
    expect(() =>
      compileCreateTransaction(
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
        kind: 'transfer',
        outcomeAccountId: 'cash',
        incomeAccountId: 'cash',
        outcome: 1,
        date: '2026-07-28',
      })
    ).toThrow('Transfer accounts must be different')

    expect(() =>
      materialize({
        kind: 'transfer',
        outcomeAccountId: 'cash',
        incomeAccountId: 'euro',
        outcome: 1,
        date: '2026-07-28',
      })
    ).toThrow('Cross-instrument transfer requires income amount')
  })

  it('requires a root user before creating an operation', () => {
    const data = makeData()
    data.user = {}

    expect(() =>
      compileCreateTransaction(
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
