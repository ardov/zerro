import { makeGoal } from './shared/helpers'
import { sendEvent } from '@shared/helpers/tracking'
import { TISOMonth } from '@shared/types'
import { AppThunk } from '@store'
import { goalStore } from './goalStore'
import { TGoal } from './shared/types'
import { TEnvelopeId } from '@entities/envelope'

export const setGoal =
  (month: TISOMonth, id: TEnvelopeId, goal?: TGoal | null): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const monthlyGoals = goalStore.getData(state)[month] || {}
    const newGoal = makeGoal(goal)
    const newGoals = { ...monthlyGoals, [id]: newGoal }

    // Track these events
    if (newGoal?.amount) {
      sendEvent(`Goals: set ${newGoal.type} goal`)
    } else {
      sendEvent(`Goals: delete goal`)
    }

    dispatch(goalStore.setData(newGoals, month))
  }
