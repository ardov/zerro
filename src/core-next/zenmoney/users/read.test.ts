import { describe, expect, it } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { TInstrument } from '../instruments'
import {
  getRootUser,
  getRootUserId,
  getUserCurrency,
  getUserInstrumentId,
} from '.'
import type { TUser } from './types'

describe('zenmoney users', () => {
  it('derives root user from data', () => {
    const data = makeStore({
      user: {
        2: user({ id: 2, parent: 1, currency: 2 }),
        1: user({ id: 1, parent: null, currency: 1 }),
      },
      instrument: {
        1: instrument({ id: 1, shortTitle: 'EUR' }),
        2: instrument({ id: 2, shortTitle: 'USD' }),
      },
    })

    expect(getRootUser(data)?.id).toBe(1)
    expect(getRootUserId(data)).toBe(1)
    expect(getUserInstrumentId(data)).toBe(1)
    expect(getUserCurrency(data)).toBe('EUR')
  })

  it('falls back when root user or instrument is missing', () => {
    expect(getRootUser(makeStore())).toBeNull()
    expect(getRootUserId(makeStore())).toBeNull()
    expect(getUserInstrumentId(makeStore())).toBeNull()
    expect(getUserCurrency(makeStore())).toBe('USD')

    expect(
      getUserCurrency(
        makeStore({
          user: {
            1: user({ id: 1, parent: null, currency: 999 }),
          },
        })
      )
    ).toBe('USD')
  })
})

function user(value: Pick<TUser, 'id' | 'parent' | 'currency'>): TUser {
  return {
    changed: 0,
    country: 1,
    countryCode: 'US',
    email: null,
    login: null,
    monthStartDay: 1,
    isForecastEnabled: false,
    planBalanceMode: 'balance',
    planSettings: '',
    paidTill: 0,
    subscription: '',
    subscriptionRenewalDate: null,
    ...value,
  }
}

function instrument(
  value: Pick<TInstrument, 'id' | 'shortTitle'>
): TInstrument {
  return {
    changed: 0,
    title: '',
    symbol: '',
    rate: 1,
    ...value,
  }
}

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
