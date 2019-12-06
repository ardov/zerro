import { getRootUser } from 'store/data/users'
import slice from './slice'
import { goalDates, goalTypes } from './constants'
import { createBudget } from './createBudget'
const { setBudget } = slice.actions

export const setGoal = ({ type, amount, date, tag }) => (
  dispatch,
  getState
) => {
  const state = getState()
  const user = getRootUser(state).id

  // create type budget
  const typeBudget = createBudget({
    user,
    tag,
    date: goalDates.type,
    outcome: goalTypes.findIndex(goalType => goalType === type),
  })

  // create amount budget
  const amountBudget = createBudget({
    user,
    tag,
    date: goalDates.amount,
    outcome: amount,
  })

  // create date budget
  const dateBudget = createBudget({
    user,
    tag,
    date: goalDates.date,
    outcome: date,
  })

  dispatch(setBudget(typeBudget))
  dispatch(setBudget(amountBudget))
  dispatch(setBudget(dateBudget))
}

export const deleteGoal = tag => (dispatch, getState) => {
  const state = getState()
  const user = getRootUser(state).id

  // create empty goal budgets
  const typeBudget = createBudget({ user, tag, date: goalDates.type })
  const amountBudget = createBudget({ user, tag, date: goalDates.amount })
  const dateBudget = createBudget({ user, tag, date: goalDates.date })

  dispatch(setBudget(typeBudget))
  dispatch(setBudget(amountBudget))
  dispatch(setBudget(dateBudget))
}
