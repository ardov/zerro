import { normalizeGoal } from 'core-next/zerro/goals'
import { executeCommand } from 'core-next/adapters/redux'
import { sendEvent } from '6-shared/helpers/tracking'
import { TISOMonth } from '6-shared/types'
import { AppThunk } from 'store'
import { TEnvelopeId } from '5-entities/envelope'
import { TGoal } from './shared/types'

export const setGoal =
  (month: TISOMonth, id: TEnvelopeId, goal?: TGoal | null): AppThunk =>
  dispatch => {
    const newGoal = normalizeGoal(goal)
    dispatch(
      executeCommand({
        v: 1,
        type: 'zerro.goal.set',
        payload: { month, id, goal: newGoal },
      })
    )

    // Track these events
    if (newGoal !== null) sendEvent(`Goals: set ${newGoal.type} goal`)
    else sendEvent(`Goals: delete goal`)
  }
