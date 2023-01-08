import { sendEvent } from '@shared/helpers/tracking'
import { TISOMonth } from '@shared/types'
import { AppThunk } from '@store'
import { goalModel, goalType } from '@entities/goal'
import { TBudgetUpdate } from '@entities/budget'
import { setTotalBudget } from '@features/budget/setTotalBudget'

export const fillGoals =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: fill goals')
    const goals = goalModel.get(getState())[month]
    const updates: TBudgetUpdate[] = []

    Object.values(goals).forEach(goalInfo => {
      let { id, goal, needNow, targetBudget } = goalInfo
      // Ignore filled goals
      if (!needNow) return
      // Ignore endless goals with target balance
      if (goal.type === goalType.TARGET_BALANCE && !goal.end) return
      updates.push({ id, month, value: targetBudget })
    })

    dispatch(setTotalBudget(updates))
  }
