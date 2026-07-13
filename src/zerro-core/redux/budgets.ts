import { createSelector } from '@reduxjs/toolkit'
import { buildBudgets, getEnvBudgets } from '../domain/zerro'
import { getTagBudgets } from '../domain/zenmoney'
import * as settings from './settings'
import { selectReminderSlice, selectTagBudgetSlice } from './state'
export { setBudget as set, type TBudgetUpdate } from './commands'

const selectEnvBudgets = createSelector([selectReminderSlice], reminder =>
  getEnvBudgets({ reminder })
)
export const selectAll = createSelector(
  [selectTagBudgetSlice, selectEnvBudgets, settings.select],
  (budget, envBudgets, userSettings) =>
    buildBudgets({
      tagBudgets: getTagBudgets({ budget }),
      envBudgets,
      preferZmBudgets: userSettings.preferZmBudgets,
    })
)
