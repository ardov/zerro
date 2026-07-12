import { describe, expect, it } from 'vitest'
import {
  makeInstrument,
  makeStore,
  makeUser,
} from '../../../testing/zenmoneyTestData'
import {
  getRootUser,
  getRootUserId,
  getUserCurrency,
  getUserInstrumentId,
} from '.'

describe('zenmoney users', () => {
  it('derives root user from data', () => {
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
            1: makeUser({ id: 1, parent: null, currency: 999 }),
          },
        })
      )
    ).toBe('USD')
  })
})
