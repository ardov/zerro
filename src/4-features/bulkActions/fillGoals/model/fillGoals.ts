import { sendEvent } from '6-shared/helpers/tracking'
import { TISOMonth } from '6-shared/types'
import { AppThunk } from 'store'
import { budgets as coreBudgets, goals as coreGoals } from 'zerro-core/redux'

import { setTotalBudget } from '4-features/budget/setTotalBudget'

export const fillGoals =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: fill goals')
    const goals = coreGoals.selectAll(getState())[month]
    const updates: coreBudgets.TBudgetUpdate[] = []

    Object.values(goals).forEach(goalInfo => {
      const { id, goal, needNow, targetBudget } = goalInfo
      // Ignore filled goals
      if (!needNow) return
      // Ignore endless goals with target balance
      if (goal.type === coreGoals.goalType.TARGET_BALANCE && !goal.end) return
      updates.push({ id, month, value: targetBudget })
    })

    dispatch(setTotalBudget(updates))
  }
