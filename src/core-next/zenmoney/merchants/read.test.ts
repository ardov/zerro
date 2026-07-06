import { describe, expect, it } from 'vitest'
import { makeMerchant, makeStore } from '../../testing/zenmoneyTestData'
import { getMerchant, getMerchants } from './read'

describe('zenmoney merchant reads', () => {
  it('reads merchants by map and id', () => {
    const shop = makeMerchant({ id: 'shop', title: 'Shop' })
    const data = makeStore({
      merchant: {
        shop,
      },
    })

    expect(getMerchants(data)).toBe(data.merchant)
    expect(getMerchant(data, 'shop')).toBe(shop)
    expect(getMerchant(data, 'missing')).toBeNull()
  })
})
