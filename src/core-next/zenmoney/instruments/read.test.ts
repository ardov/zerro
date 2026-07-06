import { describe, expect, it } from 'vitest'
import { makeInstrument, makeStore } from '../../testing/zenmoneyTestData'
import {
  getInstrument,
  getInstrumentByCode,
  getInstrumentCode,
  getInstrumentCodeById,
  getInstrumentsByCode,
} from './read'

describe('zenmoney instruments', () => {
  it('builds currency lookup helpers from normalized data', () => {
    const data = makeStore({
      instrument: {
        1: makeInstrument({ id: 1, shortTitle: 'USD', title: 'US Dollar' }),
        2: makeInstrument({ id: 2, shortTitle: 'EUR', title: 'Euro' }),
      },
    })

    expect(getInstrument(data, 1)?.title).toBe('US Dollar')
    expect(getInstrumentCode(data, 2)).toBe('EUR')
    expect(getInstrumentCodeById(data)).toEqual({
      1: 'USD',
      2: 'EUR',
    })
    expect(Object.keys(getInstrumentsByCode(data))).toEqual(['USD', 'EUR'])
    expect(getInstrumentByCode(data, 'USD')?.id).toBe(1)
  })

  it('returns null for missing instruments', () => {
    const data = makeStore()

    expect(getInstrument(data, 999)).toBeNull()
    expect(getInstrumentCode(data, 999)).toBeNull()
    expect(getInstrumentByCode(data, 'USD')).toBeNull()
  })
})
