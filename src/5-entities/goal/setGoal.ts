import { sendEvent } from '6-shared/helpers/tracking'
import { TISOMonth } from '6-shared/types'
import { keys } from '6-shared/helpers/keys'
import { AppThunk } from 'store'
import { TEnvelopeId } from '5-entities/envelope'
import { goalStore } from './goalStore'
import { makeGoal } from './shared/helpers'
import { TGoal } from './shared/types'

export const setGoal =
  (month: TISOMonth, id: TEnvelopeId, goal?: TGoal | null): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const goals = goalStore.getData(state)
    const newGoal = makeGoal(goal)

    // Update goals in given month
    const currentGoals = goals[month] || {}
    const newGoals = { ...currentGoals, [id]: newGoal }
    dispatch(goalStore.setData(newGoals, month))

    // null-goals are blocking goals from continuing in future
    // if we are settin a new goal we should delete all future blockers
    if (newGoal) removeFutureGoalBlocks()

    // Track these events
    if (newGoal !== null) sendEvent(`Goals: set ${newGoal.type} goal`)
    else sendEvent(`Goals: delete goal`)

    function removeFutureGoalBlocks() {
      const futureMonths = keys(goals)
        .sort((a, b) => a.localeCompare(b))
        .filter(date => date > month)

      for (const date of futureMonths) {
        // Remove blocker-goal
        if (goals[date][id] === null) {
          const newGoals = { ...goals[date] }
          delete newGoals[id]
          dispatch(goalStore.setData(newGoals, date))
          return
        }

        // If there is a set goal in future we should stop deleting null-goals
        if (goals[date][id]) break
      }
    }
  }
