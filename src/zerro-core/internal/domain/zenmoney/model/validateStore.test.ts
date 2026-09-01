import { describe, expect, it } from 'vitest'
import {
  makeAccount,
  makeBudget,
  makeInstrument,
  makeReminderMarker,
  makeStore,
  makeTag,
  makeTransaction,
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

  it('accepts server-retained orphans and future semantic values', () => {
    const store = makeStore({
      serverTimestamp: 100,
      instrument: { 1: makeInstrument({ id: 1 }) },
      country: {
        1: { id: 1, title: 'United States', currency: 1, domain: null },
      },
      user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
      account: {
        future: makeAccount({ id: 'future', type: 'future-type' }),
        debt: makeAccount({ id: 'debt', type: AccountType.Debt }),
      },
      budget: {
        '2026-01-01#deleted-tag': makeBudget({
          id: '2026-01-01#deleted-tag',
          tag: 'deleted-tag',
        }),
      },
      reminderMarker: {
        marker: makeReminderMarker({
          id: 'marker',
          reminder: 'deleted-reminder',
          incomeInstrument: 1,
          incomeAccount: 'future',
          outcomeInstrument: 1,
          outcomeAccount: 'future',
          state: 'future-state',
        }),
      },
    })

    expect(validateDataStore(store)).toEqual({ ok: true })
  })

  // Round 9: deleting an ordinary account nulls the leg that pointed at it on
  // a debt operation and soft-deletes the row instead of purging it. That row
  // is canonical state the server keeps sending, so rejecting it would put a
  // replica into a recovery it cannot leave.
  it('accepts a null account leg only on a soft-deleted transaction', () => {
    const base = makeStore({
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
    })

    // Both legs are still typed as required, which is precisely the lie this
    // shape exposes. The cast keeps that visible here instead of hiding it
    // behind a widened field that 21 other files would have to reckon with.
    const nullOutcomeLeg = (patch: Parameters<typeof makeTransaction>[0]) =>
      ({
        ...makeTransaction({ incomeAccount: 'debt', ...patch }),
        outcomeAccount: null,
      }) as unknown as ReturnType<typeof makeTransaction>

    expect(
      validateDataStore({
        ...base,
        transaction: { tr: nullOutcomeLeg({ id: 'tr', deleted: true }) },
      })
    ).toMatchObject({ ok: true })

    expect(
      validateDataStore({
        ...base,
        transaction: { tr: nullOutcomeLeg({ id: 'tr', deleted: false }) },
      })
    ).toMatchObject({
      ok: false,
      reason: expect.stringContaining('transaction[0].outcomeAccount'),
    })
  })
})
