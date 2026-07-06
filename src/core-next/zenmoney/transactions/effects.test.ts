import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeStore,
  makeTransaction,
} from '../../testing/zenmoneyTestData'
import { withTransactionAccountBalanceEffects } from './effects'

describe('zenmoney transaction effects', () => {
  it('adds account balance deltas for new transactions', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', balance: 100 }),
        card: makeAccount({ id: 'card', balance: 50 }),
      },
    })

    const patch = withTransactionAccountBalanceEffects(
      data,
      {
        transaction: [
          makeTransaction({
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
      makeAccount({ id: 'cash', balance: 125, changed: 100 }),
      makeAccount({ id: 'card', balance: 40, changed: 100 }),
    ])
  })

  it('reverses old transaction effects when transactions are deleted', () => {
    const data = makeStore({
      account: {
        card: makeAccount({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: makeTransaction({
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
          makeTransaction({
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
      makeAccount({ id: 'card', balance: 60, changed: 100 }),
    ])
  })

  it('uses net deltas when transactions move between accounts', () => {
    const data = makeStore({
      account: {
        cash: makeAccount({ id: 'cash', balance: 100 }),
        card: makeAccount({ id: 'card', balance: 50 }),
      },
      transaction: {
        tr: makeTransaction({
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
          makeTransaction({
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
      makeAccount({ id: 'card', balance: 60, changed: 100 }),
      makeAccount({ id: 'cash', balance: 120, changed: 100 }),
    ])
  })

  it('preserves existing account patches and applies balance deltas to them', () => {
    const data = makeStore({
      account: {
        card: makeAccount({ id: 'card', title: 'Card', balance: 50 }),
      },
    })

    const patch = withTransactionAccountBalanceEffects(
      data,
      {
        account: [makeAccount({ id: 'card', title: 'Renamed', balance: 70 })],
        transaction: [
          makeTransaction({
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
      makeAccount({ id: 'card', title: 'Renamed', balance: 60, changed: 100 }),
    ])
  })

  it('does not require accounts for non-financial transaction changes', () => {
    const data = makeStore({
      transaction: {
        tr: makeTransaction({ id: 'tr', comment: 'Old' }),
      },
    })

    const patch = withTransactionAccountBalanceEffects(
      data,
      {
        transaction: [makeTransaction({ id: 'tr', comment: 'New' })],
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
            makeTransaction({
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
