import { getRootUser } from 'store/serverData'
import { setBudget } from 'store/localData/budgets'
import selectors from 'store/localData/budgets/selectors'
import { getPopulatedTag } from 'store/localData/tags'
import getMonthDates from '../selectors/getMonthDates'
import { getAmountsByTag } from '../selectors/getAmountsByTag'
import sendEvent from 'helpers/sendEvent'
import { createBudget } from 'store/localData/budgets/helpers'

export const setOutcomeBudget = (targetOutcome, monthDate, tagId) => (
  dispatch,
  getState
) => {
  sendEvent('Budgets: set budget')
  const state = getState()
  const created = selectors.getBudget(state, tagId, monthDate)
  const amounts = getAmountsByTag(state)
  const user = getRootUser(state).id
  const parentTagId = getPopulatedTag(state, tagId).parent
  const i = getMonthDates(state).findIndex(date => +date === +monthDate)

  let outcome = targetOutcome

  if (!parentTagId) {
    // if it's top level category
    const { budgeted, totalBudgeted } = amounts[i].tags.find(
      ({ id }) => id === tagId
    )
    const childrenBudgets = totalBudgeted - budgeted
    outcome = targetOutcome - childrenBudgets
  }

  const budget = created || createBudget({ user, date: +monthDate, tag: tagId })
  const changed = { ...budget, outcome, changed: Date.now() }
  dispatch(setBudget(changed))
}

export default { setOutcomeBudget }
