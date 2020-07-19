import { createSelector } from 'redux-starter-kit'
import sendEvent from 'helpers/sendEvent'
import { GOALS } from '../constants'
import { makeGoal, parseGoal } from './helpers'
import { getTags } from '../../tags'
import { getRawGoals } from '../selectors'
import { setHiddenData } from '../thunks'

// THUNKS
export const setGoal = ({ type, amount, end, tag }) => (dispatch, getState) => {
  const state = getState()
  const goals = getRawGoals(state)
  const tags = getTags(state)
  let newGoals = { ...goals }

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
  dispatch(setHiddenData(GOALS, newGoals))
}

// SELECTORS
export const getGoals = createSelector(
  [getRawGoals, getTags],
  (rawGoals, tags) => {
    let goals = {}
    for (const tag in rawGoals) {
      if (rawGoals[tag] && tags[tag]) goals[tag] = parseGoal(rawGoals[tag])
    }
    return goals
  }
)

export const getGoal = (state, id) => getGoals(state)[id]
