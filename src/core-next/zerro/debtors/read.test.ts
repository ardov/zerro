import { describe, expect, it } from 'vitest'
import type { ById, TInstrument, TMerchant, TTransaction } from '6-shared/types'
import { buildDebtors, cleanPayee } from './read'

describe('buildDebtors', () => {
  it('collects payee debt transactions and balances', () => {
    const result = buildDebtors({
      transactions: [
        transaction({
          id: 'lend',
          income: 50,
          incomeAccount: 'debt',
          outcome: 50,
          outcomeAccount: 'card',
          payee: 'Alex!',
        }),
        transaction({
          id: 'repay',
          income: 20,
          incomeAccount: 'card',
          outcome: 20,
          outcomeAccount: 'debt',
          payee: 'Alex!',
        }),
      ],
      merchants: {},
      instruments,
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
        transaction({
          id: 'merchant-debt',
          income: 10,
          incomeAccount: 'debt',
          outcome: 10,
          outcomeAccount: 'card',
          merchant: 'm1',
        }),
      ],
      merchants: {
        m1: merchant({ id: 'm1', title: 'Bob & Co.' }),
      },
      instruments,
      debtAccountId: 'debt',
    })

    expect(result.bobco).toMatchObject({
      id: 'bobco',
      name: 'Bob & Co.',
      merchantId: 'm1',
      merchantName: 'Bob & Co.',
      balance: { USD: 10 },
    })
  })

  it('ignores non-debt transactions and cleans payee names like legacy', () => {
    const result = buildDebtors({
      transactions: [
        transaction({
          id: 'regular',
          income: 0,
          outcome: 10,
          outcomeAccount: 'card',
          payee: 'Alex!',
        }),
      ],
      merchants: {},
      instruments,
      debtAccountId: 'debt',
    })

    expect(result).toEqual({})
    expect(cleanPayee(' Вася + Alex! ')).toBe('васяalex')
  })
})

const instruments: ById<TInstrument> = {
  1: {
    id: 1,
    changed: 1,
    title: 'US Dollar',
    shortTitle: 'USD',
    symbol: '$',
    rate: 1,
  },
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
