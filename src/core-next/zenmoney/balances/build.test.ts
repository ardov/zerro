import { describe, expect, it } from 'vitest'
import type { ById, TAccount, TInstrumentId } from '6-shared/types'
import { AccountType } from '6-shared/types'
import { makeAccount, makeTransaction } from '../../testing/zenmoneyTestData'
import {
  buildBalances,
  buildBalancesByDate,
  buildTransactionEffect,
  convertBalancesToDisplay,
  getHistoryStart,
} from './build'

describe('buildTransactionEffect', () => {
  it('converts income, outcome, transfer, and debt transactions to balance effects', () => {
    expect(
      buildTransactionEffect(
        makeTransaction({ id: 'income', income: 10 }),
        baseInput
      )
    ).toEqual({
      id: 'income',
      date: '2026-01-10',
      accounts: { cash: { USD: 10 } },
    })

    expect(
      buildTransactionEffect(
        makeTransaction({ id: 'outcome', outcome: 5 }),
        baseInput
      )
    ).toEqual({
      id: 'outcome',
      date: '2026-01-10',
      accounts: { card: { USD: -5 } },
    })

    expect(
      buildTransactionEffect(
        makeTransaction({
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
        makeTransaction({ id: 'income', date: '2026-01-01', income: 100 }),
        makeTransaction({
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
          makeTransaction({ date: '1970-01-01' }),
          makeTransaction({ date: '2026-01-02' }),
        ],
        '2026-01-10'
      )
    ).toBe('2026-01-02')
  })
})

describe('convertBalancesToDisplay', () => {
  it('converts account and debtor fx amounts to display values', () => {
    expect(
      convertBalancesToDisplay(
        [
          {
            date: '2026-01-01',
            balances: {
              accounts: { cash: { USD: 10 } },
              debtors: { alex: { USD: -5 } },
            },
          },
        ],
        amount => amount.USD || 0
      )
    ).toEqual([
      {
        date: '2026-01-01',
        balances: {
          accounts: { cash: 10 },
          debtors: { alex: -5 },
        },
      },
    ])
  })
})

const baseInput = {
  merchants: {},
  instrumentCodeById: {
    1: 'USD',
  } as Record<TInstrumentId, 'USD'>,
  debtAccountId: 'debt',
}

const accounts: ById<TAccount> = {
  cash: makeAccount({
    id: 'cash',
    type: AccountType.Checking,
    instrument: 1,
    balance: 70,
  }),
}
