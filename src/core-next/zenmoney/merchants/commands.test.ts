import { describe, expect, it } from 'vitest'
import type { TDataStore, TMerchant } from '6-shared/types'
import { compilePatchMerchant } from './commands'

describe('zenmoney merchant commands', () => {
  it('patches existing merchants with deterministic time', () => {
    const data = makeStore({
      merchant: {
        shop: merchant({ id: 'shop', title: 'Shop', changed: 1 }),
      },
    })

    const patch = compilePatchMerchant(
      data,
      { id: 'shop', title: 'Market' },
      { now: () => 100 }
    )

    expect(patch.merchant?.[0]).toEqual(
      merchant({ id: 'shop', title: 'Market', changed: 100 })
    )
  })

  it('validates merchant id and existence', () => {
    const data = makeStore({
      merchant: {
        shop: merchant({ id: 'shop', title: 'Shop', changed: 1 }),
      },
    })

    expect(() =>
      compilePatchMerchant(data, { title: 'No id' } as any, { now: () => 1 })
    ).toThrow('Trying to patch merchant without id')
    expect(() =>
      compilePatchMerchant(
        data,
        { id: 'missing', title: 'Missing' },
        {
          now: () => 1,
        }
      )
    ).toThrow('Merchant not found')
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

function merchant(patch: Partial<TMerchant> & { id: string }): TMerchant {
  return {
    changed: 0,
    user: 1,
    title: '',
    ...patch,
  } as TMerchant
}
