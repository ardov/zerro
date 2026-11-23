import { describe, expect, it } from 'vitest'
import {
  initialMerchantSearch,
  merchantMatchPriority,
  merchantSearchQueries,
} from '../../merchant/merchantSearch'

const usage = {
  searchTerms: {
    payee: ['legacy shop'],
    originalPayee: ['amzn mktp de amazon de'],
  },
}

describe('merchantSearchQueries', () => {
  it('converts punctuation keys before normalizing and omits empty variants', () => {
    expect(merchantSearchQueries('[kt,')).toContain('хлеб')
    expect(merchantSearchQueries('  LEGACY, SHOP!  ')).toContain('legacy shop')
    expect(merchantSearchQueries('.')).toContain('ю')
    expect(merchantSearchQueries('.')).not.toContain('')
    expect(merchantSearchQueries('   ')).toEqual([])
  })
})

describe('merchantMatchPriority', () => {
  it('ranks title, payee, then original payee matches', () => {
    const queries = ['amazon', 'legacy shop', 'amzn mktp']
    const title = merchantMatchPriority('amazon', usage, queries)
    const payee = merchantMatchPriority('retailer', usage, queries)
    const original = merchantMatchPriority('retailer', usage, ['amzn mktp'])
    expect(title).toBeLessThan(payee)
    expect(payee).toBeLessThan(original)
    expect(Number.isFinite(original)).toBe(true)
  })

  it('ranks by the best matching field across all query variants', () => {
    expect(
      merchantMatchPriority('amazon', usage, ['legacy shop', 'amazon'])
    ).toBe(merchantMatchPriority('amazon', undefined, ['amazon']))
    expect(
      merchantMatchPriority('retailer', usage, ['amzn mktp', 'legacy shop'])
    ).toBe(merchantMatchPriority('retailer', usage, ['legacy shop']))
  })

  it('finds a merchant title inside an initial raw payee query', () => {
    const query = ['amzn mktp de amazon de']
    expect(merchantMatchPriority('amazon', undefined, query)).toBeLessThan(
      merchantMatchPriority('retailer', undefined, query)
    )
  })

  it('does not match partial words in the reverse direction', () => {
    expect(
      Number.isFinite(
        merchantMatchPriority('mart', undefined, ['supermarket purchase'])
      )
    ).toBe(false)
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
