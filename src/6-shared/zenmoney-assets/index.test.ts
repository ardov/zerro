import { describe, expect, it } from 'vitest'
import { bankIconById } from './bankIcons'
import bankLogo from './banks/ic_bank_12574_54px.svg?inline'
import motorcycle from './categories/a3004_motorcycle.svg?inline'
import taxi from './categories/a3004_taxi.svg?inline'
import { categoryIconById, noCategoryIconUrl } from './index'

describe('Zenmoney asset catalog', () => {
  it('resolves category icons with a shared numeric prefix by their full name', () => {
    expect(categoryIconById['3004_motorcycle']).toBe(motorcycle)
    expect(categoryIconById['3004_taxi']).toBe(taxi)
  })

  it('resolves bank logos by company ID and provides an inline uncategorized icon', () => {
    expect(bankIconById[12574]).toBe(bankLogo)
    expect(noCategoryIconUrl).toMatch(/^data:image\/svg\+xml/)
  })
})
