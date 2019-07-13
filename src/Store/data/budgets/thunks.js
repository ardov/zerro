import { getRootUser } from 'store/data/users'
import { format } from 'date-fns'
import slice from './slice'

const { setBudget } = slice.actions

export const setOutcomeBudget = (outcome, month, tagId) => (
  dispatch,
  getState
) => {
  const budgets = getState().data.budget
  const formattedMonth = format(month, 'YYYY-MM-DD')
  const id = tagId + ',' + formattedMonth
  const userId = getRootUser(getState()).id

  const budget = budgets[id]
    ? budgets[id]
    : createBudget({ user: userId, date: formattedMonth, tag: tagId })
  const changed = { ...budget, outcome, changed: Date.now() / 1000 }

  dispatch(setBudget(changed))
}

function createBudget({
  user,
  changed = Date.now() / 1000,
  date,
  tag,
  income = 0,
  incomeLock = false,
  outcome = 0,
  outcomeLock = false,
}) {
  return {
    user,
    changed,
    date,
    tag,
    income,
    incomeLock,
    outcome,
    outcomeLock,
  }
}

export default { setOutcomeBudget }
