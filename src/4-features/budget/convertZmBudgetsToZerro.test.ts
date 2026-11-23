import { configureStore } from '@reduxjs/toolkit'
import { expect, it } from 'vitest'
import { globalBudgetTagId } from '@/6-shared/types'
import { rootReducer } from '@/store/rootReducer'
import { makeTestRootState } from '@/store/testing'
import { core } from '@/zerro-core/redux'
import {
  makeBudget,
  makeInstrument,
  makeStore,
  makeTag,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { convertZmBudgetsToZerro } from './convertZmBudgetsToZerro'

it('converts only nonzero category allocations into Zerro budgets', () => {
  const date = '2026-07-01'
  const current = makeStore({
    instrument: { 1: makeInstrument({ id: 1, shortTitle: 'USD' }) },
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    tag: {
      food: makeTag({ id: 'food', title: 'Food' }),
      empty: makeTag({ id: 'empty', title: 'Empty' }),
    },
    budget: {
      [`${date}#food`]: makeBudget({
        id: `${date}#food`,
        tag: 'food',
        date,
        outcome: 12_000,
      }),
      [`${date}#empty`]: makeBudget({
        id: `${date}#empty`,
        tag: 'empty',
        date,
      }),
      [`${date}#${globalBudgetTagId}`]: makeBudget({
        id: `${date}#${globalBudgetTagId}`,
        tag: globalBudgetTagId,
        date,
        outcome: 20_000,
      }),
    },
  })
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: makeTestRootState(current),
  })

  const converted = store.dispatch(convertZmBudgetsToZerro())

  expect(converted).toEqual([
    { id: 'tag#food', month: '2026-07', value: 12_000 },
  ])
  expect(core.budgets.selectAll(store.getState())).toEqual({
    '2026-07': { 'tag#food': 12_000 },
  })
})
