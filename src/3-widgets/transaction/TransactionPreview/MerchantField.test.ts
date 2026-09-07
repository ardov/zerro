import { describe, expect, it } from 'vitest'
import { initialMerchantSearch, merchantMatchPriority } from './merchantSearch'

const usage = {
  searchTerms: {
    payee: ['legacy shop'],
    originalPayee: ['amzn mktp de amazon de'],
  },
}

describe('merchantMatchPriority', () => {
  it('ranks title, payee, then original payee matches', () => {
    expect(merchantMatchPriority('amazon', usage, 'amazon')).toBe(0)
    expect(merchantMatchPriority('retailer', usage, 'legacy shop')).toBe(1)
    expect(merchantMatchPriority('retailer', usage, 'amzn mktp')).toBe(2)
  })

  it('finds a merchant title inside an initial raw payee query', () => {
    expect(
      merchantMatchPriority('amazon', usage, 'amzn mktp de amazon de')
    ).toBe(0)
  })

  it('does not match partial words in the reverse direction', () => {
    expect(merchantMatchPriority('mart', usage, 'supermarket purchase')).toBe(
      Number.POSITIVE_INFINITY
    )
  })
})

describe('initialMerchantSearch', () => {
  it('starts with a standalone payee and leaves a chosen merchant unfiltered', () => {
    expect(initialMerchantSearch(false, 'Amazon.de*zl74v08e4')).toBe(
      'Amazon.de*zl74v08e4'
    )
    expect(initialMerchantSearch(true, 'Amazon.de*zl74v08e4')).toBe('')
  })
})
