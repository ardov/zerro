import { getRootUser } from 'store/serverData'
import { setBudget } from 'store/localData/budgets'
import selectors from 'store/localData/budgets/selectors'
import { getPopulatedTag } from 'store/localData/tags'
import { getAmountsByTag } from '../selectors/getAmountsByTag'
import sendEvent from 'helpers/sendEvent'
import { createBudget } from 'store/localData/budgets/helpers'

export const moveFunds = (amount, source, destination, monthDate) => (
  dispatch,
  getState
) => {
  if (!source || !amount || !destination || source === destination) return
  sendEvent('Budgets: move funds')
  const state = getState()
  const user = getRootUser(state).id

  let resultBudgets = []

  // replace null id
  source = source === 'null' ? null : source
  destination = destination === 'null' ? null : destination

  if (source !== 'toBeBudgeted') {
    const sourceBudget =
      selectors.getBudget(state, source, monthDate) ||
      createBudget({ user, date: +monthDate, tag: source })

    resultBudgets.push({
      ...sourceBudget,
      outcome: sourceBudget.outcome - amount,
      changed: Date.now(),
    })
  }

  if (destination !== 'toBeBudgeted') {
    const destinationBudget =
      selectors.getBudget(state, destination, monthDate) ||
      createBudget({ user, date: +monthDate, tag: destination })

    resultBudgets.push({
      ...destinationBudget,
      outcome: destinationBudget.outcome + amount,
      changed: Date.now(),
    })
  }

  dispatch(setBudget(resultBudgets))
}

export const setOutcomeBudget = (targetOutcome, month, tagId) => (
  dispatch,
  getState
) => {
  sendEvent('Budgets: set budget')
  const state = getState()
  const created = selectors.getBudget(state, tagId, month)
  const amounts = getAmountsByTag(state)[month]
  const user = getRootUser(state).id
  const parentTagId = getPopulatedTag(state, tagId).parent

  let outcome = targetOutcome

  if (!parentTagId) {
    // if it's top level category
    const { budgeted, totalBudgeted } = amounts[tagId]
    const childrenBudgets = totalBudgeted - budgeted
    outcome = targetOutcome - childrenBudgets
  }

  const budget = created || createBudget({ user, date: +month, tag: tagId })
  const changed = { ...budget, outcome, changed: Date.now() }
  dispatch(setBudget(changed))
}

export default { setOutcomeBudget }
