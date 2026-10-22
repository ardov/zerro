import { describe, expect, it } from 'vitest'
import {
  makeInstrument,
  makeStore,
  makeUser,
} from '../../../../support/testing/zenmoneyTestData'
import { getInstCodeMap } from './instruments'
import {
  getRootUser,
  getRootUserId,
  getUserCurrency,
  getUserInstrumentId,
} from './users'

describe('zenmoney users', () => {
  it('derives root user and currency from data', () => {
    const data = makeStore({
      user: {
        2: makeUser({ id: 2, parent: 1, currency: 2 }),
        1: makeUser({ id: 1, parent: null, currency: 1 }),
      },
      instrument: {
        1: makeInstrument({ id: 1, shortTitle: 'EUR' }),
        2: makeInstrument({ id: 2, shortTitle: 'USD' }),
      },
    })
    expect(getRootUser(data.user)?.id).toBe(1)
    expect(getRootUserId(data.user)).toBe(1)
    expect(getUserInstrumentId(data.user)).toBe(1)
    expect(
      getUserCurrency({
        users: data.user,
        instrumentCodes: getInstCodeMap(data.instrument),
      })
    ).toBe('EUR')
  })

  it('falls back without a root user or instrument', () => {
    const rootWithoutInstrument = {
      1: makeUser({ id: 1, parent: null, currency: 9 }),
    }
    expect(
      getUserCurrency({ users: rootWithoutInstrument, instrumentCodes: {} })
    ).toBe('USD')
    expect(getRootUser(makeStore().user)).toBeNull()
    expect(getRootUserId(makeStore().user)).toBeNull()
    expect(getUserInstrumentId(makeStore().user)).toBeNull()
    expect(
      getUserCurrency({ users: makeStore().user, instrumentCodes: {} })
    ).toBe('USD')
  })
})
