import { sendEvent } from '@shared/helpers/tracking'
import { TISOMonth } from '@shared/types'
import { AppThunk } from '@store'
import {
  setEnvelopeBudgets,
  TEnvBudgetUpdate,
} from '@features/setEnvelopeBudget'
import { goalModel, goalType } from '@entities/goal'

export const fillGoals =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: fill goals')
    let state = getState()
    let goals = goalModel.get(state)[month]
    const updates: TEnvBudgetUpdate[] = []
    Object.values(goals).forEach(goalInfo => {
      if (
        !goalInfo?.needNow ||
        (goalInfo?.goal.type === goalType.TARGET_BALANCE && !goalInfo?.goal.end)
      )
        return
      updates.push({ id: goalInfo.id, value: goalInfo.targetBudget, month })
    })
    dispatch(setEnvelopeBudgets(updates))
  }
