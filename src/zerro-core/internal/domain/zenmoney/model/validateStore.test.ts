import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeTag,
  makeUser,
} from '../../../../support/testing/zenmoneyTestData'
import { AccountType } from '../entities/accounts'
import { validateDataStore } from './validateStore'

describe('validateDataStore', () => {
  it('accepts a complete server snapshot', () => {
    const store = makeStore({
      serverTimestamp: 100,
      instrument: {
        1: makeInstrument({ id: 1 }),
      },
      country: {
        1: { id: 1, title: 'United States', currency: 1, domain: null },
      },
      user: {
        1: makeUser({ id: 1, parent: null, currency: 1 }),
      },
      account: {
        cash: makeAccount({ id: 'cash', type: AccountType.Cash }),
        debt: makeAccount({ id: 'debt', type: AccountType.Debt }),
      },
      tag: {
        food: makeTag({ id: 'food', parent: null }),
      },
      budget: {
        '2026-01-01#food': {
          id: '2026-01-01#food',
          changed: 1,
          user: 1,
          date: '2026-01-01',
          tag: 'food',
          income: 0,
          incomeLock: true,
          isIncomeForecast: false,
          outcome: 0,
          outcomeLock: true,
          isOutcomeForecast: false,
        },
      },
    })

    expect(validateDataStore(store)).toEqual({ ok: true })
  })

  it('rejects missing or duplicate debt accounts', () => {
    const base = makeStore({
      serverTimestamp: 100,
      instrument: { 1: makeInstrument({ id: 1 }) },
      country: {
        1: { id: 1, title: 'United States', currency: 1, domain: null },
      },
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: {
        cash: makeAccount({ id: 'cash', type: AccountType.Cash }),
      },
    })

    expect(validateDataStore(base)).toMatchObject({
      ok: false,
      reason: expect.stringContaining('exactly one debt account'),
    })
    expect(
      validateDataStore({
        ...base,
        account: {
          ...base.account,
          debt1: makeAccount({ id: 'debt1', type: AccountType.Debt }),
          debt2: makeAccount({ id: 'debt2', type: AccountType.Debt }),
        },
      })
    ).toMatchObject({
      ok: false,
      reason: expect.stringContaining('exactly one debt account'),
    })
  })

  it('rejects dangling references and tag cycles', () => {
    const store = makeStore({
      serverTimestamp: 100,
      instrument: { 1: makeInstrument({ id: 1 }) },
      country: {
        1: { id: 1, title: 'United States', currency: 1, domain: null },
      },
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: {
        cash: makeAccount({ id: 'cash', type: AccountType.Cash }),
        debt: makeAccount({ id: 'debt', type: AccountType.Debt }),
      },
      tag: {
        a: makeTag({ id: 'a', parent: 'b' }),
        b: makeTag({ id: 'b', parent: 'a' }),
      },
    })

    expect(validateDataStore(store)).toMatchObject({
      ok: false,
      reason: expect.stringContaining('tag parent cycle'),
    })

    expect(
      validateDataStore({
        ...store,
        tag: { a: makeTag({ id: 'a', parent: null }) },
        account: {
          cash: makeAccount({ id: 'cash', type: AccountType.Cash }),
          debt: makeAccount({
            id: 'debt',
            type: AccountType.Debt,
            instrument: 999,
          }),
        },
      })
    ).toMatchObject({
      ok: false,
      reason: expect.stringContaining('account[1].instrument'),
    })
  })
})
