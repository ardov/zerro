import { describe, expect, it } from 'vitest'
import type {
  ById,
  TInstrumentId,
  TMerchant,
  TTransaction,
} from '6-shared/types'
import { AccountType } from '6-shared/types'
import { TDebtor } from '../debtors'
import {
  buildBalances,
  buildBalancesByDate,
  buildTransactionEffect,
  getHistoryStart,
  TBalanceAccount,
} from './build'

describe('buildTransactionEffect', () => {
  it('converts income, outcome, transfer, and debt transactions to balance effects', () => {
    expect(
      buildTransactionEffect(transaction({ id: 'income', income: 10 }), baseInput)
    ).toEqual({
      id: 'income',
      date: '2026-01-10',
      accounts: { cash: { USD: 10 } },
    })

    expect(
      buildTransactionEffect(
        transaction({ id: 'outcome', outcome: 5 }),
        baseInput
      )
    ).toEqual({
      id: 'outcome',
      date: '2026-01-10',
      accounts: { card: { USD: -5 } },
    })

    expect(
      buildTransactionEffect(
        transaction({
          id: 'debt',
          income: 20,
          incomeAccount: 'debt',
          outcome: 20,
          outcomeAccount: 'card',
          payee: 'Alex!',
        }),
        baseInput
      )
    ).toEqual({
      id: 'debt',
      date: '2026-01-10',
      accounts: { card: { USD: -20 } },
      debtors: { alex: { USD: 20 } },
    })
  })
})

describe('buildBalances', () => {
  it('builds current, starting, day, and transaction balances', () => {
    const result = buildBalances({
      transactions: [
        transaction({ id: 'income', date: '2026-01-01', income: 100 }),
        transaction({
          id: 'outcome',
          date: '2026-01-02',
          outcome: 30,
          outcomeAccount: 'cash',
        }),
      ],
      accounts,
      debtors: {},
      ...baseInput,
    })

    expect(result.byDay['2026-01-02'].accounts.cash).toEqual({ USD: 70 })
    expect(result.byTransaction.outcome.accounts.cash).toEqual({ USD: 70 })
    expect(result.byTransaction.income.accounts.cash).toEqual({ USD: 100 })
    expect(result.startingBalances.accounts.cash).toEqual({ USD: 0 })
  })
})

describe('buildBalancesByDate', () => {
  it('fills dates between history start and current date', () => {
    const result = buildBalancesByDate({
      balances: {
        byDay: {
          '2026-01-02': {
            accounts: { cash: { USD: 10 } },
            debtors: {},
          },
        },
        byTransaction: {},
        startingBalances: {
          accounts: { cash: { USD: 0 } },
          debtors: {},
        },
      },
      historyStart: '2026-01-01',
      currentDate: '2026-01-03',
    })

    expect(result.map(node => node.date)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ])
    expect(result[0].balances.accounts.cash).toEqual({ USD: 0 })
    expect(result[1].balances.accounts.cash).toEqual({ USD: 10 })
    expect(result[2].balances.accounts.cash).toEqual({ USD: 10 })
  })
})

describe('getHistoryStart', () => {
  it('uses the first reasonable transaction date', () => {
    expect(
      getHistoryStart(
        [
          transaction({ date: '1970-01-01' }),
          transaction({ date: '2026-01-02' }),
        ],
        '2026-01-10'
      )
    ).toBe('2026-01-02')
  })
})

const baseInput = {
  merchants: {},
  instrumentCodeById: {
    1: 'USD',
  } as Record<TInstrumentId, 'USD'>,
  debtAccountId: 'debt',
}

const accounts: ById<TBalanceAccount> = {
  cash: {
    id: 'cash',
    type: AccountType.Checking,
    fxCode: 'USD',
    balance: 70,
  },
}

function transaction(patch: Partial<TTransaction>): TTransaction {
  return {
    id: 'tr',
    changed: 1,
    created: 1,
    user: 1,
    deleted: false,
    hold: null,
    date: '2026-01-10',
    income: 0,
    incomeAccount: 'cash',
    incomeInstrument: 1,
    outcome: 0,
    outcomeAccount: 'card',
    outcomeInstrument: 1,
    tag: null,
    merchant: null,
    payee: null,
    originalPayee: null,
    comment: null,
    reminderMarker: null,
    opIncome: 0,
    opIncomeInstrument: null,
    opOutcome: 0,
    opOutcomeInstrument: null,
    latitude: null,
    longitude: null,
    ...patch,
  } as TTransaction
}

function merchant(patch: Partial<TMerchant> & { id: string }): TMerchant {
  const { id, ...rest } = patch
  return {
    id,
    changed: 1,
    user: 1,
    title: 'Merchant',
    ...rest,
  }
}

function debtor(patch: Partial<TDebtor> & { id: string }): TDebtor {
  const { id, ...rest } = patch
  return {
    id,
    name: id,
    payeeNames: [id],
    transactions: [],
    balance: {},
    ...rest,
  }
}
