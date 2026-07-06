import { describe, expect, it } from 'vitest'
import type { TAccount, TDataStore, TTransaction } from '6-shared/types'
import { withTransactionAccountBalanceEffects } from './effects'

describe('zenmoney transaction effects', () => {
  it('adds account balance deltas for new transactions', () => {
    const data = makeStore({
      account: {
        cash: account({ id: 'cash', balance: 100 }),
        card: account({ id: 'card', balance: 50 }),
      },
    })

    const patch = withTransactionAccountBalanceEffects(
      data,
      {
        transaction: [
          transaction({
            id: 'tr',
            income: 25,
            incomeAccount: 'cash',
            outcome: 10,
            outcomeAccount: 'card',
          }),
        ],
      },
      { now: () => 100 }
    )

    expect(patch.account).toEqual([
      account({ id: 'cash', balance: 125, changed: 100 }),
      account({ id: 'card', balance: 40, changed: 100 }),
    ])
  })

  it('reverses old transaction effects when transactions are deleted', () => {
    const data = makeStore({
      account: {
        card: account({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: transaction({
          id: 'tr',
          income: 0,
          incomeAccount: 'cash',
          outcome: 10,
          outcomeAccount: 'card',
        }),
      },
    })

    const patch = withTransactionAccountBalanceEffects(
      data,
      {
        transaction: [
          transaction({
            id: 'tr',
            deleted: true,
            income: 0,
            incomeAccount: 'cash',
            outcome: 10,
            outcomeAccount: 'card',
          }),
        ],
      },
      { now: () => 100 }
    )

    expect(patch.account).toEqual([
      account({ id: 'card', balance: 60, changed: 100 }),
    ])
  })

  it('uses net deltas when transactions move between accounts', () => {
    const data = makeStore({
      account: {
        cash: account({ id: 'cash', balance: 100 }),
        card: account({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: transaction({
          id: 'tr',
          income: 0,
          incomeAccount: 'cash',
          outcome: 10,
          outcomeAccount: 'card',
        }),
      },
    })

    const patch = withTransactionAccountBalanceEffects(
      data,
      {
        transaction: [
          transaction({
            id: 'tr',
            income: 20,
            incomeAccount: 'cash',
            outcome: 0,
            outcomeAccount: 'card',
          }),
        ],
      },
      { now: () => 100 }
    )

    expect(patch.account).toEqual([
      account({ id: 'card', balance: 60, changed: 100 }),
      account({ id: 'cash', balance: 120, changed: 100 }),
    ])
  })

  it('preserves existing account patches and applies balance deltas to them', () => {
    const data = makeStore({
      account: {
        card: account({ id: 'card', title: 'Card', balance: 50 }),
      },
    })

    const patch = withTransactionAccountBalanceEffects(
      data,
      {
        account: [account({ id: 'card', title: 'Renamed', balance: 70 })],
        transaction: [
          transaction({
            id: 'tr',
            income: 0,
            incomeAccount: 'cash',
            outcome: 10,
            outcomeAccount: 'card',
          }),
        ],
      },
      { now: () => 100 }
    )

    expect(patch.account).toEqual([
      account({ id: 'card', title: 'Renamed', balance: 60, changed: 100 }),
    ])
  })

  it('does not require accounts for non-financial transaction changes', () => {
    const data = makeStore({
      transaction: {
        tr: transaction({ id: 'tr', comment: 'Old' }),
      },
    })

    const patch = withTransactionAccountBalanceEffects(
      data,
      {
        transaction: [transaction({ id: 'tr', comment: 'New' })],
      },
      { now: () => 100 }
    )

    expect(patch.account).toBeUndefined()
  })

  it('validates accounts when financial deltas are produced', () => {
    expect(() =>
      withTransactionAccountBalanceEffects(
        makeStore(),
        {
          transaction: [
            transaction({
              id: 'tr',
              income: 0,
              incomeAccount: 'cash',
              outcome: 10,
              outcomeAccount: 'missing',
            }),
          ],
        },
        { now: () => 100 }
      )
    ).toThrow('Account not found')
  })
})

function makeStore(patch: Partial<TDataStore> = {}): TDataStore {
  return {
    serverTimestamp: 0,
    instrument: {},
    country: {},
    company: {},
    user: {},
    merchant: {},
    account: {},
    tag: {},
    budget: {},
    reminder: {},
    reminderMarker: {},
    transaction: {},
    ...patch,
  } as TDataStore
}

function account(patch: Partial<TAccount> & { id: string }): TAccount {
  return {
    user: 1,
    instrument: 1,
    title: '',
    changed: 0,
    role: null,
    company: null,
    type: 'cash',
    syncID: null,
    balance: 0,
    startBalance: 0,
    creditLimit: 0,
    inBalance: false,
    savings: false,
    enableCorrection: false,
    enableSMS: false,
    archive: false,
    private: false,
    capitalization: null,
    percent: null,
    startDate: null,
    endDateOffset: null,
    endDateOffsetInterval: null,
    payoffStep: null,
    payoffInterval: null,
    ...patch,
  } as TAccount
}

function transaction(
  patch: Partial<TTransaction> & { id: string }
): TTransaction {
  return {
    changed: 0,
    created: 0,
    user: 1,
    deleted: false,
    hold: null,
    viewed: false,
    qrCode: null,
    incomeBankID: null,
    income: 0,
    incomeInstrument: 1,
    incomeAccount: 'cash',
    outcomeBankID: null,
    outcome: 0,
    outcomeInstrument: 1,
    outcomeAccount: 'card',
    tag: null,
    merchant: null,
    payee: null,
    originalPayee: null,
    comment: null,
    date: '2026-01-01',
    mcc: null,
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
