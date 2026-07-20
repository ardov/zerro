import { describe, expect, it } from 'vitest'
import {
  makeMerchant as makeTestMerchant,
  makeStore,
} from '../../../../support/testing/zenmoneyTestData'
import { compilePatchMerchant } from './merchants'
import { makeMerchant } from './merchants'

describe('zenmoney merchant commands', () => {
  it('compiles sparse patches for existing merchants', () => {
    const data = makeStore({
      merchant: {
        shop: makeTestMerchant({ id: 'shop', title: 'Shop', changed: 1 }),
      },
    })

    const patch = compilePatchMerchant(data.merchant, {
      id: 'shop',
      title: 'Market',
    })

    expect(patch.merchant?.[0]).toEqual({ id: 'shop', title: 'Market' })
  })

  it('creates production merchant defaults through the merchant factory', () => {
    expect(
      makeMerchant(
        {
          user: 1,
          title: 'Shop',
        },
        {
          now: () => 100,
          uuid: () => 'shop',
        }
      )
    ).toEqual(
      makeTestMerchant({ id: 'shop', user: 1, title: 'Shop', changed: 100 })
    )
  })

  it('validates merchant id and existence', () => {
    const data = makeStore({
      merchant: {
        shop: makeTestMerchant({ id: 'shop', title: 'Shop', changed: 1 }),
      },
    })

    expect(() =>
      compilePatchMerchant(data.merchant, { title: 'No id' } as any)
    ).toThrow('Trying to patch merchant without id')
    expect(() =>
      compilePatchMerchant(data.merchant, { id: 'missing', title: 'Missing' })
    ).toThrow('Merchant not found')
  })
})
