import { describe, expect, it } from 'vitest'
import { bankIconById, unknownBankIconBySize } from './bankIcons'
import { categoryIconById, noCategoryIconUrl } from './index'

describe('ZenMoney asset catalog', () => {
  it('exposes every extracted category by its full tag.icon name', () => {
    expect(Object.keys(categoryIconById)).toHaveLength(167)
    expect(categoryIconById['3004_motorcycle']).toBeTruthy()
    expect(categoryIconById['3004_taxi']).toBeTruthy()
  })

  it('exposes every numbered bank icon and the no-category fallback', () => {
    expect(Object.keys(bankIconById)).toHaveLength(382)
    expect(bankIconById['12574']).toBeTruthy()
    expect(Object.keys(unknownBankIconBySize)).toEqual(['24', '36', '54'])
    expect(noCategoryIconUrl).toBeTruthy()
  })
})
