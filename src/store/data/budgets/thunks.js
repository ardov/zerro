import { getRootUser } from 'store/data/users'
import { setBudget } from './index'
import { goalBudgetDate } from './constants'
import { createGoal, createBudget } from './helpers'

export const setGoal = ({ type, amount, date, tag }) => (
  dispatch,
  getState
) => {
  const state = getState()
  const user = getRootUser(state).id
  const goal = createGoal({ user, tag, type, amount, date })
  dispatch(setBudget(goal))
}

export const deleteGoal = tag => (dispatch, getState) => {
  const state = getState()
  const user = getRootUser(state).id

  // create empty goal budget
  const typeBudget = createBudget({ user, tag, date: goalBudgetDate })
  dispatch(setBudget(typeBudget))
}
