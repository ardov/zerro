import { getRootUser } from 'store/serverData'
import { setBudget } from 'store/localData/budgets'
import selectors from 'store/localData/budgets/selectors'
import { getPopulatedTag } from 'store/localData/tags'
import { getAmountsByTag } from '../selectors/getAmountsByTag'
import sendEvent from 'helpers/sendEvent'
import { createBudget } from 'store/localData/budgets/helpers'
import { getBudgetsByMonthAndTag } from 'store/localData/budgets'
import { getTags } from 'store/localData/tags'
import { subMonths } from 'date-fns/esm'
import { getGoalsProgress } from '../selectors/goalsProgress'

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

export const copyPreviousBudget = month => (dispatch, getState) => {
  sendEvent('Budgets: copy previous')
  const state = getState()
  const tags = getTags(state)
  const user = getRootUser(state).id
  const prevMonth = +subMonths(month, 1)
  const budgets = getBudgetsByMonthAndTag(state)
  const currentBudgets = budgets[month]
  const prevBudgets = budgets[prevMonth]
  if (!prevBudgets || !tags || !budgets) return

  const changedArr = []
  for (const id in tags) {
    const prevValue = prevBudgets[id]?.outcome || 0
    const currentValue = currentBudgets[id]?.outcome || 0
    if (prevValue !== currentValue) {
      changedArr.push(
        createBudget({ user, date: +month, tag: id, outcome: prevValue })
      )
    }
  }

  dispatch(setBudget(changedArr))
}

export const fillGoals = month => (dispatch, getState) => {
  sendEvent('Budgets: fill goals')
  const state = getState()
  const goalsProgress = getGoalsProgress(state)?.[month]
  const tags = getTags(state)
  const user = getRootUser(state).id
  const budgets = getBudgetsByMonthAndTag(state)?.[month]

  if (!goalsProgress || !tags) return

  const changedArr = []
  for (const tag in goalsProgress) {
    const target = goalsProgress[tag]?.target || 0
    const currentBudget = budgets[tag]?.outcome || 0
    if (currentBudget < target) {
      changedArr.push(
        createBudget({ user, date: +month, tag, outcome: target })
      )
    }
  }

  dispatch(setBudget(changedArr))
}
