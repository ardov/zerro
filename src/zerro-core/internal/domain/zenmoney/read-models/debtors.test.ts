import { describe, expect, it } from 'vitest'
import {
  makeMerchant,
  makeTransaction,
  usdInstruments,
} from '../../../../support/testing/zenmoneyTestData'
import { buildDebtors, buildDebtorNames } from './debtors'

describe('buildDebtors', () => {
  it('collects payee debt transactions and balances', () => {
    const result = buildDebtors({
      transactions: [
        makeTransaction({
          id: 'lend',
          income: 50,
          incomeAccount: 'debt',
          outcome: 50,
          outcomeAccount: 'card',
          payee: 'Alex!',
        }),
        makeTransaction({
          id: 'repay',
          income: 20,
          incomeAccount: 'card',
          outcome: 20,
          outcomeAccount: 'debt',
          payee: 'Alex!',
        }),
      ],
      merchants: {},
      instruments: usdInstruments,
      debtAccountId: 'debt',
    })

    expect(result.alex.name).toBe('Alex!')
    expect(result.alex.payeeNames).toEqual(['Alex!'])
    expect(result.alex.transactions.map(tr => tr.id)).toEqual(['lend', 'repay'])
    expect(result.alex.balance).toEqual({ USD: 30 })
  })

  it('collects merchant debt transactions under cleaned merchant title', () => {
    const result = buildDebtors({
      transactions: [
        makeTransaction({
          id: 'merchant-debt',
          income: 10,
          incomeAccount: 'debt',
          outcome: 10,
          outcomeAccount: 'card',
          merchant: 'm1',
        }),
      ],
      merchants: {
        m1: makeMerchant({ id: 'm1', title: 'Bob & Co.' }),
      },
      instruments: usdInstruments,
      debtAccountId: 'debt',
    })

    expect(result['bob co']).toMatchObject({
      id: 'bob co',
      name: 'Bob & Co.',
      merchantId: 'm1',
      merchantName: 'Bob & Co.',
      balance: { USD: 10 },
    })
  })

  it('ignores non-debt transactions', () => {
    const result = buildDebtors({
      transactions: [
        makeTransaction({
          id: 'regular',
          income: 0,
          outcome: 10,
          outcomeAccount: 'card',
          payee: 'Alex!',
        }),
      ],
      merchants: {},
      instruments: usdInstruments,
      debtAccountId: 'debt',
    })

    expect(result).toEqual({})
  })
})

it('uses real account currencies when debt legs differ', () => {
  const result = buildDebtors({
    transactions: [
      makeTransaction({
        income: 90,
        incomeInstrument: 2,
        incomeAccount: 'debt',
        outcome: 100,
        outcomeInstrument: 1,
        outcomeAccount: 'card',
        merchant: 'alex',
      }),
      makeTransaction({
        income: 20,
        incomeInstrument: 1,
        incomeAccount: 'card',
        outcome: 18,
        outcomeInstrument: 2,
        outcomeAccount: 'debt',
        payee: 'Alex!',
      }),
    ],
    merchants: { alex: makeMerchant({ id: 'alex', title: 'Alex' }) },
    instruments: {
      ...usdInstruments,
      2: { ...usdInstruments[1], id: 2, shortTitle: 'EUR' },
    },
    debtAccountId: 'debt',
  })
  expect(result.alex.balance).toEqual({ USD: 80 })
  expect(result.alex.transactions).toHaveLength(2)
})

it('uses the same stable merchant name for balances and filter options in either history order', () => {
  const merchant = makeTransaction({
    id: 'merchant',
    income: 10,
    outcome: 10,
    incomeAccount: 'debt',
    outcomeAccount: 'card',
    merchant: 'alex',
  })
  const payee = { ...merchant, id: 'payee', merchant: null, payee: 'Alex!' }
  for (const transactions of [
    [merchant, payee],
    [payee, merchant],
  ]) {
    const input = {
      transactions,
      merchants: { alex: makeMerchant({ id: 'alex', title: 'Alex' }) },
      instruments: usdInstruments,
      debtAccountId: 'debt',
    }
    expect(buildDebtorNames(input)).toEqual({ alex: 'Alex' })
    expect(buildDebtors(input).alex.name).toBe('Alex')
  }
})

it('keeps the payee-only label stable when history order changes', () => {
  const first = makeTransaction({
    income: 10,
    outcome: 10,
    incomeAccount: 'debt',
    outcomeAccount: 'card',
    payee: 'Alex!',
  })
  const second = { ...first, id: 'second', payee: 'Alex' }
  const input = {
    merchants: {},
    instruments: usdInstruments,
    debtAccountId: 'debt',
  }
  for (const transactions of [
    [first, second],
    [second, first],
  ]) {
    expect(buildDebtorNames({ ...input, transactions })).toEqual({
      alex: 'Alex',
    })
    expect(buildDebtors({ ...input, transactions }).alex.name).toBe('Alex')
  }
})
