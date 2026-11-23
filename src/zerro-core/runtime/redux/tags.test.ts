import { beforeAll, describe, expect, it } from 'vitest'
import { i18n } from '@/6-shared/localization'
import { categoryIconById, noCategoryIconUrl } from '@/6-shared/zenmoney-assets'
import { makeDemoStore } from '../../support/demo'
import { makeTestRootState } from '@/store/testing'
import { makeStore, makeTag } from '../../support/testing/zenmoneyTestData'
import { selectPopulatedTags } from '../../support/testing/reduxSelectors'
import { presentTags } from './tags'

const NOW = Date.parse('2026-05-15T12:00:00Z')

const makeRootState = makeTestRootState

describe('Core tag presentation adapter', () => {
  beforeAll(() => i18n.changeLanguage('en'))

  it('gives uncategorized transactions a label, icon and display colour', () => {
    const tag = selectPopulatedTags(makeRootState(makeStore())).null

    expect(tag).toMatchObject({
      id: 'null',
      name: 'No Category',
      symbol: noCategoryIconUrl,
    })
    expect(tag.colorDisplay).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it.each([
    ['Я', 'Я'],
    ['', '?'],
  ])(
    'uses the available graphemes from "%s" without an icon',
    (title, symbol) => {
      expect(
        presentTags({ food: makeTag({ id: 'food', title, icon: null }) }).food
          .symbol
      ).toBe(symbol)
    }
  )

  it('uses a leading emoji as the icon only when the tag has none', () => {
    const tags = presentTags({
      plain: makeTag({ id: 'plain', title: '🍔 Food', icon: null }),
      iconic: makeTag({ id: 'iconic', title: '🍔 Food', icon: '1006_pizza' }),
    })
    expect(tags.plain).toMatchObject({ name: 'Food', symbol: '🍔' })
    expect(tags.iconic.name).toBe('🍔 Food')
    expect(tags.iconic.symbol).toBe(categoryIconById['1006_pizza'])
  })

  it('owns display names, duplicate labels, colors, and the tag tree', () => {
    const tags = presentTags({
      parent: makeTag({
        id: 'parent',
        title: '🍔 Food',
        color: 0xff8800,
      }),
      child: makeTag({
        id: 'child',
        title: '🍔 Food',
        parent: 'parent',
      }),
    })

    expect(tags.parent).toMatchObject({
      name: 'Food',
      uniqueName: 'Food',
      children: ['child'],
      colorHEX: '#ff8800',
      colorDisplay: '#ff8800',
      symbol: '🍔',
    })
    expect(tags.child).toMatchObject({
      name: 'Food',
      uniqueName: 'Food / Food',
      children: [],
    })
  })

  it('stays cached across unrelated data changes and recomputes for tags', () => {
    const store = makeDemoStore({ now: NOW })
    const first = selectPopulatedTags(makeRootState(store))
    const unrelated = makeRootState({ ...store, company: { ...store.company } })
    const tagId = Object.keys(store.tag)[0]
    const changed = makeRootState({
      ...store,
      tag: { ...store.tag, [tagId]: { ...store.tag[tagId], title: 'Changed' } },
    })

    expect(selectPopulatedTags(unrelated)).toBe(first)
    expect(selectPopulatedTags(changed)[tagId].name).toBe('Changed')
  })
})
