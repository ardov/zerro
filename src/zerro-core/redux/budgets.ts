import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'store'
import { buildBudgets } from '../domain/zerro'
import { graph } from './graph'
import * as settings from './settings'
export { setBudget as set, type TBudgetUpdate } from './commands'

export const selectAll = createSelector(
  [
    (state: RootState) => graph.tagBudgets(state.data.current),
    (state: RootState) => graph.envBudgets(state.data.current),
    settings.select,
  ],
  (tagBudgets, envBudgets, userSettings) =>
    buildBudgets({
      tagBudgets,
      envBudgets,
      preferZmBudgets: userSettings.preferZmBudgets,
    })
)
