import { configureStore } from '@reduxjs/toolkit'
import { expect, it } from 'vitest'
import { i18n } from '@/6-shared/localization'
import { undoClientCommand } from '@/store/data'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import { makeDemoStore } from '@/zerro-core/demo'
import { core } from '@/zerro-core/redux'
import { createEnvelope } from './createEnvelope'

it('creates a default-named envelope with metadata and undoes it together', () => {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(
      makeDemoStore({ now: Date.parse('2026-07-10T12:00:00Z') })
    ),
  })
  const group = i18n.t('defaultTagGroup', { ns: 'common' })

  const id = store.dispatch(
    createEnvelope({ comment: 'Household expenses', group, index: 2 })
  )

  expect(core.envelopes.selectAll(store.getState())[id]).toMatchObject({
    name: i18n.t('tagNew', { ns: 'common' }),
    comment: 'Household expenses',
    group,
    indexRaw: 2,
  })
  store.dispatch(undoClientCommand())
  expect(core.envelopes.selectAll(store.getState())[id]).toBeUndefined()
})
