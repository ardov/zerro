import { describe, expect, it } from 'vitest'

import {
  createTagIconCatalog,
  getTagIcon,
  getTagIconEmoji,
  getTagIconSvg,
} from './index'

describe('tag icon catalog', () => {
  it('reads ZenMoney emoji icons by id', () => {
    expect(getTagIconEmoji('9002_money_bag')).toBe('💰')
  })

  it('accepts adapter-provided SVG urls without owning app assets', () => {
    const icon = getTagIcon('9002_money_bag', {
      svgById: { '9002_money_bag': '/icons/9002_money_bag.svg' },
    })

    expect(icon).toEqual({
      id: '9002_money_bag',
      emoji: '💰',
      svg: '/icons/9002_money_bag.svg',
    })
  })

  it('can build a combined catalog from emoji and svg sources', () => {
    const catalog = createTagIconCatalog({
      svgById: { custom: '/custom.svg' },
    })

    expect(catalog['9002_money_bag'].emoji).toBe('💰')
    expect(catalog.custom).toEqual({
      id: 'custom',
      emoji: null,
      svg: '/custom.svg',
    })
    expect(getTagIconSvg('custom', { svgById: { custom: '/custom.svg' } })).toBe(
      '/custom.svg'
    )
  })
})

