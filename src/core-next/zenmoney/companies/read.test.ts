import { describe, expect, it } from 'vitest'
import type { TDataStore } from '6-shared/types'
import { getActiveCompanies, getCompanies, getCompany } from './read'
import type { TCompany } from './types'

describe('zenmoney companies', () => {
  it('reads companies by id', () => {
    const data = makeStore({
      company: {
        1: company({ id: 1, title: 'Bank' }),
      },
    })

    expect(getCompanies(data)).toBe(data.company)
    expect(getCompany(data, 1)?.title).toBe('Bank')
    expect(getCompany(data, 999)).toBeNull()
  })

  it('filters active companies', () => {
    const data = makeStore({
      company: {
        1: company({ id: 1, title: 'Active', deleted: false }),
        2: company({ id: 2, title: 'Deleted', deleted: true }),
      },
    })

    expect(getActiveCompanies(data).map(company => company.title)).toEqual([
      'Active',
    ])
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

function company(patch: Partial<TCompany> & { id: number }): TCompany {
  return {
    changed: 0,
    title: '',
    fullTitle: null,
    www: null,
    country: null,
    countryCode: null,
    deleted: false,
    ...patch,
  } as TCompany
}
