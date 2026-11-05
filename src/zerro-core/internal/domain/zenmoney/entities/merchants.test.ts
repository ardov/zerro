import { describe, expect, it } from 'vitest'
import {
  makeMerchant as makeTestMerchant,
  makeStore,
} from '../../../../support/testing/zenmoneyTestData'
import {
  compileCreateMerchant,
  compilePatchMerchant,
  makeMerchant,
  normalizePayee,
} from './merchants'

const ctx = { now: () => 100, uuid: () => 'new' }

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

  it('creates a merchant and names it in the receipt', () => {
    const data = makeStore({ merchant: {} })

    expect(compileCreateMerchant(data.merchant, '  Shop  ', ctx)).toEqual({
      patch: { merchant: [{ id: 'new', title: 'Shop' }] },
      receipt: { merchantId: 'new' },
    })
  })

  it('reuses a merchant whose title is already taken', () => {
    const data = makeStore({
      merchant: {
        shop: makeTestMerchant({ id: 'shop', title: 'Bob & Co.', changed: 1 }),
      },
    })

    expect(compileCreateMerchant(data.merchant, 'bob co', ctx)).toEqual({
      patch: {},
      receipt: { merchantId: 'shop' },
    })
  })

  it('refuses a blank title', () => {
    expect(() =>
      compileCreateMerchant(makeStore({ merchant: {} }).merchant, ' ', ctx)
    ).toThrow('Trying to create merchant without title')
  })
})

describe('normalizePayee', () => {
  it('keys titles and payees the same way, keeping word boundaries', () => {
    expect(normalizePayee(' Вася + Alex! ')).toBe('вася + alex')
    expect(normalizePayee('A B')).not.toBe(normalizePayee('AB'))
    expect(normalizePayee('张三')).toBe('张三')
    expect(normalizePayee(null)).toBe('')
  })
})
