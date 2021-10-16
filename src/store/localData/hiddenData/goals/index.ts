import { createSelector } from '@reduxjs/toolkit'
import { sendEvent } from 'helpers/tracking'
import { DataReminderType } from '../constants'
import { makeGoal, parseGoal } from './helpers'
import { getTags } from '../../tags'
import { getRawGoals } from '../selectors'
import { setHiddenData } from '../thunks'
import { AppThunk, RootState } from 'store'
import { ById, Goal, TagId } from 'types'

// THUNKS
export const setGoal = ({
  type,
  amount,
  end,
  tag,
}: Goal & { tag: TagId }): AppThunk => (dispatch, getState) => {
  const state = getState()
  const goals = getRawGoals(state)
  const tags = getTags(state)
  let newGoals = goals ? { ...goals } : {}

  // remove goals for deleted tags
  for (const tagId in newGoals) {
    if (!tags[tagId]) delete newGoals[tagId]
  }

  if (!amount) {
    sendEvent(`Goals: delete goal`)
    delete newGoals[tag]
  } else {
    sendEvent(`Goals: set ${type} goal`)
    newGoals[tag] = makeGoal({ type, amount, end })
  }
  dispatch(setHiddenData(DataReminderType.GOALS, newGoals))
}

// SELECTORS
export const getGoals = createSelector(
  [getRawGoals, getTags],
  (rawGoals, tags) => {
    let goals: ById<Goal> = {}
    for (const tag in rawGoals) {
      if (rawGoals[tag] && tags[tag]) goals[tag] = parseGoal(rawGoals[tag])
    }
    return goals
  }
)

export const getGoal = (state: RootState, id: TagId) => getGoals(state)[id]
