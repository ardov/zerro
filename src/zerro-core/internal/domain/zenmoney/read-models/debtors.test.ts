import { describe, expect, it } from 'vitest'
import {
  makeMerchant,
  makeTransaction,
  usdInstruments,
} from '../../../../support/testing/zenmoneyTestData'
import { buildDebtors, cleanPayee } from './debtors'

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
    expect(cleanPayee(' Вася + Alex! ')).toBe('васяalex')
  })
})
