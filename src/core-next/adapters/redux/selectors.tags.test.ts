import { describe, expect, it, vi } from 'vitest'
import type { TDataStore } from '6-shared/types'
import type { RootState } from 'store'
import { i18n } from '6-shared/localization'
import { makeDemoStore } from '../../demo'

vi.mock('5-entities/shared/hidden-store/dataAccount', () => ({
  DATA_ACC_NAME: '🤖 [Zerro Data]',
  getDataAccountId: () => undefined,
  prepareDataAccount: () => {
    throw new Error('prepareDataAccount is not available in this test')
  },
}))

const NOW = Date.parse('2026-05-15T12:00:00Z')

function makeRootState(data: TDataStore): RootState {
  return {
    data: { current: data, server: data, diff: undefined },
    displayCurrency: null,
    isPending: false,
    lastSync: { finishedAt: 0, isSuccessful: null, errorMessage: null },
    token: null,
  }
}

describe('Core tag presentation adapter', () => {
  it('matches the legacy populated-tag selector', async () => {
    await i18n.changeLanguage('en')
    const [{ tagModel }, { selectCorePopulatedTags }] = await Promise.all([
      import('5-entities/tag'),
      import('./selectors'),
    ])
    const state = makeRootState(makeDemoStore({ now: NOW }))

    expect(selectCorePopulatedTags(state)).toEqual(
      tagModel.getPopulatedTags(state)
    )
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
