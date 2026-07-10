import { v1 as uuidv1 } from 'uuid'
import { compileSetGoal, normalizeGoal } from 'core-next/zerro/goals'
import { sendEvent } from '6-shared/helpers/tracking'
import { TISOMonth } from '6-shared/types'
import { applyClientPatch } from 'store/data'
import { AppThunk } from 'store'
import { TEnvelopeId } from '5-entities/envelope'
import { TGoal } from './shared/types'

export const setGoal =
  (month: TISOMonth, id: TEnvelopeId, goal?: TGoal | null): AppThunk =>
  (dispatch, getState) => {
    const newGoal = normalizeGoal(goal)
    const patch = compileSetGoal(getState().data.current, month, id, goal, {
      now: Date.now,
      uuid: uuidv1,
    })
    dispatch(applyClientPatch(patch))

    // Track these events
    if (newGoal !== null) sendEvent(`Goals: set ${newGoal.type} goal`)
    else sendEvent(`Goals: delete goal`)
  }
