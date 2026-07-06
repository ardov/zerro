import { describe, expect, it } from 'vitest'
import type { TDataStore } from '6-shared/types'
import {
  getInstrument,
  getInstrumentByCode,
  getInstrumentCode,
  getInstrumentCodeById,
  getInstrumentsByCode,
} from './read'
import type { TInstrument } from './types'

describe('zenmoney instruments', () => {
  it('builds currency lookup helpers from normalized data', () => {
    const data = makeStore({
      instrument: {
        1: instrument({ id: 1, shortTitle: 'USD', title: 'US Dollar' }),
        2: instrument({ id: 2, shortTitle: 'EUR', title: 'Euro' }),
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

function instrument(patch: Partial<TInstrument> & { id: number }): TInstrument {
  return {
    changed: 0,
    title: '',
    shortTitle: '',
    symbol: '',
    rate: 1,
    ...patch,
  } as TInstrument
}
