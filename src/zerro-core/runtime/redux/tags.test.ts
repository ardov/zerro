import { beforeAll, describe, expect, it } from 'vitest'
import { i18n } from '@/6-shared/localization'
import { makeDemoStore } from '../../support/demo'
import { makeTestRootState } from '@/store/testing'
import { makeTag } from '../../support/testing/zenmoneyTestData'
import { selectPopulatedTags } from '../../support/testing/reduxSelectors'
import { presentTags } from './tags'

const NOW = Date.parse('2026-05-15T12:00:00Z')

const makeRootState = makeTestRootState

describe('Core tag presentation adapter', () => {
  beforeAll(() => i18n.changeLanguage('en'))

  it('adds presentation fields and the uncategorized tag', () => {
    const state = makeRootState(makeDemoStore({ now: NOW }))
    const tags = selectPopulatedTags(state)
    const tag = state.data.current.tag[Object.keys(state.data.current.tag)[0]]

    expect(tags).toHaveProperty('null')
    expect(tags.null).toMatchObject({
      id: 'null',
      title: expect.any(String),
      colorDisplay: expect.any(String),
      colorGenerated: expect.any(String),
      symbol: expect.any(String),
    })
    expect(tags[tag.id]).toMatchObject({
      id: tag.id,
      title: tag.title,
      parent: tag.parent,
      colorHEX: expect.any(String),
      colorDisplay: expect.any(String),
      colorGenerated: expect.any(String),
      symbol: expect.any(String),
    })
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
    expect(tags.iconic.symbol).not.toBe('🍔')
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
    expect(selectPopulatedTags(changed)).not.toBe(first)
  })
})
