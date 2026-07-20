import { track } from '6-shared/analytics'
import type { TISOMonth } from '6-shared/types'
import type { AppThunk } from 'store'
import { core } from 'zerro-core/redux'

import { setTotalBudget } from '4-features/budget/setTotalBudget'

export const fillGoals =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    const goals = core.goals.selectAll(getState())[month]
    const updates: core.budgets.TBudgetUpdate[] = []

    Object.values(goals).forEach(goalInfo => {
      const { id, goal, needNow, targetBudget } = goalInfo
      // Ignore filled goals
      if (!needNow) return
      // Ignore endless goals with target balance
      if (goal.type === core.goals.goalType.TARGET_BALANCE && !goal.end) return
      updates.push({ id, month, value: targetBudget })
    })

    dispatch(setTotalBudget(updates))
    track('budget_automation_applied', { automation: 'fill_goals' })
  }
