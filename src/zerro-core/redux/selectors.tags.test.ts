import { describe, expect, it } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { i18n } from '6-shared/localization'
import { makeDemoStore } from '../demo'

const NOW = Date.parse('2026-05-15T12:00:00Z')

function makeRootState(data: TDataStore): RootState {
  return {
    data: { current: data, base: data, outbox: [], outboxHead: 0 },
    displayCurrency: null,
    isPending: false,
    lastSync: { finishedAt: 0, isSuccessful: null, errorMessage: null },
    token: null,
  }
}

describe('Core tag presentation adapter', () => {
  it('adds presentation fields and the uncategorized tag', async () => {
    await i18n.changeLanguage('en')
    const { selectCorePopulatedTags } = await import('./selectors')
    const state = makeRootState(makeDemoStore({ now: NOW }))
    const tags = selectCorePopulatedTags(state)
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

  it('stays cached across unrelated data changes and recomputes for tags', async () => {
    const { selectCorePopulatedTags } = await import('./selectors')
    const store = makeDemoStore({ now: NOW })
    const first = selectCorePopulatedTags(makeRootState(store))
    const unrelated = makeRootState({ ...store, company: { ...store.company } })
    const tagId = Object.keys(store.tag)[0]
    const changed = makeRootState({
      ...store,
      tag: { ...store.tag, [tagId]: { ...store.tag[tagId], title: 'Changed' } },
    })

    expect(selectCorePopulatedTags(unrelated)).toBe(first)
    expect(selectCorePopulatedTags(changed)).not.toBe(first)
  })
})
