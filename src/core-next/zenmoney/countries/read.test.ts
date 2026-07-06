import { describe, expect, it } from 'vitest'
import type { TDataStore } from '6-shared/types'
import { getCountries, getCountry } from './read'
import type { TCountry } from './types'

describe('zenmoney countries', () => {
  it('reads countries by id', () => {
    const data = makeStore({
      country: {
        1: country({ id: 1, title: 'United States', currency: 1 }),
      },
    })

    expect(getCountries(data)).toBe(data.country)
    expect(getCountry(data, 1)?.title).toBe('United States')
    expect(getCountry(data, 999)).toBeNull()
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

function country(patch: Partial<TCountry> & { id: number }): TCountry {
  return {
    title: '',
    currency: 1,
    domain: null,
    ...patch,
  } as TCountry
}
