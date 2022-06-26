import { createSelector } from '@reduxjs/toolkit'
import { sendEvent } from 'shared/helpers/tracking'
import { DataReminderType } from '../constants'
import { makeGoal } from './helpers'
import { getRawGoals } from '../selectors'
import { setHiddenData } from '../thunks'
import { AppThunk, RootState } from 'models'
import { ById, TGoal, TTagId } from 'shared/types'
import { getTags } from 'models/tags'

// THUNKS
export const setGoal =
  ({ type, amount, end, tag }: TGoal & { tag: TTagId }): AppThunk =>
  (dispatch, getState) => {
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

export const deleteGoal =
  (tag: TTagId): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const goals = getRawGoals(state)
    const tags = getTags(state)
    let newGoals = goals ? { ...goals } : {}

    // remove goals for deleted tags
    for (const tagId in newGoals) {
      if (!tags[tagId]) delete newGoals[tagId]
    }

    sendEvent(`Goals: delete goal`)
    delete newGoals[tag]

    dispatch(setHiddenData(DataReminderType.GOALS, newGoals))
  }

// SELECTORS
export const getGoals = createSelector(
  [getRawGoals, getTags],
  (rawGoals, tags) => {
    let goals: ById<TGoal> = {}
    for (const tag in rawGoals) {
      if (rawGoals[tag] && tags[tag]) goals[tag] = rawGoals[tag]
    }
    return goals
  }
)

export const getGoal = (state: RootState, id: TTagId) => getGoals(state)[id]
