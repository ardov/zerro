import { describe, expect, it } from 'vitest'
import { bankIconById, unknownBankIconBySize } from './bankIcons'
import { categoryIconById, noCategoryIconUrl } from './index'

describe('Zenmoney asset catalog', () => {
  it('exposes every extracted category by its full tag.icon name', () => {
    expect(Object.keys(categoryIconById)).toHaveLength(167)
    expect(categoryIconById['3004_motorcycle']).toMatch(/^data:image\/svg\+xml/)
    expect(categoryIconById['3004_taxi']).toMatch(/^data:image\/svg\+xml/)
  })

  it('exposes every numbered bank icon and the no-category fallback', () => {
    expect(Object.keys(bankIconById)).toHaveLength(432)
    expect(bankIconById['12574']).toMatch(/^data:image\/svg\+xml/)
    expect(Object.keys(unknownBankIconBySize)).toEqual(['24', '36', '54'])
    expect(noCategoryIconUrl).toBeTruthy()
  })
})
