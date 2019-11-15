import { getRootUser } from 'store/data/users'
import slice from 'store/data/budgets/slice'
import selectors from 'store/data/budgets/selectors'
import { getPopulatedTag } from 'store/data/tags'
import getMonthDates from '../selectors/getMonthDates'
import { getAmountsByTag } from '../selectors/getAmountsByTag'
import sendEvent from 'helpers/sendEvent'
const { setBudget } = slice.actions

export const setOutcomeBudget = (targetOutcome, monthDate, tagId) => (
  dispatch,
  getState
) => {
  sendEvent('Budgets: set budget')
  const state = getState()
  const created = selectors.getBudget(state, tagId, monthDate)
  const tags = getAmountsByTag(state)
  const user = getRootUser(state).id
  const parentTagId = getPopulatedTag(state, tagId).parent
  const i = getMonthDates(state).findIndex(date => +date === +monthDate)

  let outcome = targetOutcome

  if (!parentTagId) {
    // if it's top level category
    const { budgeted, totalBudgeted } = tags[i].find(({ id }) => id === tagId)
    const childrenBudgets = totalBudgeted - budgeted
    outcome = targetOutcome - childrenBudgets
  }

  const budget = created || createBudget({ user, date: +monthDate, tag: tagId })
  const changed = { ...budget, outcome, changed: Date.now() }
  dispatch(setBudget(changed))
}

function createBudget(b) {
  return {
    // required
    user: b.user,
    date: b.date,
    tag: b.tag,

    // optional
    changed: b.changed || Date.now(),
    income: b.income || 0,
    incomeLock: b.incomeLock || false,
    outcome: b.outcome || 0,
    outcomeLock: b.outcomeLock || false,
  }
}

export default { setOutcomeBudget }
