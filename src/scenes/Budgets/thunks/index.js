import { getRootUser } from 'store/data/selectors'
import { selectors } from 'store/localData/budgets/selectors'
import { getPopulatedTag } from 'store/localData/tags'
import { getAmountsByTag } from '../selectors/getAmountsByTag'
import { sendEvent } from 'helpers/tracking'
import { makeBudget } from 'store/localData/budgets/makeBudget'
import { getBudgetsByMonthAndTag } from 'store/localData/budgets'
import { getTags } from 'store/localData/tags'
import { subMonths } from 'date-fns/esm'
import { getGoalsProgress } from '../selectors/goalsProgress'
import { GOAL_TYPES } from 'store/localData/hiddenData/constants'
import { getGoals } from 'store/localData/hiddenData/goals'
import { applyClientPatch } from 'store/data'
const { TARGET_BALANCE } = GOAL_TYPES

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
      makeBudget({ user, date: +monthDate, tag: source })

    resultBudgets.push({
      ...sourceBudget,
      outcome: sourceBudget.outcome - amount,
      changed: Date.now(),
    })
  }

  if (destination !== 'toBeBudgeted') {
    const destinationBudget =
      selectors.getBudget(state, destination, monthDate) ||
      makeBudget({ user, date: +monthDate, tag: destination })

    resultBudgets.push({
      ...destinationBudget,
      outcome: destinationBudget.outcome + amount,
      changed: Date.now(),
    })
  }
  dispatch(applyClientPatch({ budget: resultBudgets }))
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

  const budget = created || makeBudget({ user, date: +month, tag: tagId })
  const changed = { ...budget, outcome, changed: Date.now() }
  dispatch(applyClientPatch({ budget: [changed] }))
}

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
    const prevValue = prevBudgets?.[id]?.outcome || 0
    const currentValue = currentBudgets?.[id]?.outcome || 0
    if (prevValue !== currentValue) {
      changedArr.push(
        makeBudget({ user, date: +month, tag: id, outcome: prevValue })
      )
    }
  }
  dispatch(applyClientPatch({ budget: changedArr }))
}

export const fillGoals = month => (dispatch, getState) => {
  sendEvent('Budgets: fill goals')
  const state = getState()
  const goalsProgress = getGoalsProgress(state)?.[month]
  const tags = getTags(state)
  const user = getRootUser(state).id
  const budgets = getBudgetsByMonthAndTag(state)?.[month]
  const goals = getGoals(state)

  if (!goalsProgress || !tags) return

  const changedArr = []
  for (const tag in goalsProgress) {
    if (goals[tag].type === TARGET_BALANCE && !goals[tag].end) continue
    const target = goalsProgress[tag]?.target || 0
    const currentBudget = budgets?.[tag]?.outcome || 0
    if (currentBudget < target) {
      changedArr.push(makeBudget({ user, date: +month, tag, outcome: target }))
    }
  }
  dispatch(applyClientPatch({ budget: changedArr }))
}

export const startFresh = month => (dispatch, getState) => {
  sendEvent('Budgets: start fresh')
  const state = getState()
  const prevMonth = +subMonths(month, 1)
  const user = getRootUser(state).id
  const budgets = getBudgetsByMonthAndTag(state)
  const amounts = getAmountsByTag(state)
  const prevAmounts = amounts[prevMonth]
  const currentAmounts = amounts[month]

  const removedBudgets = removeFutureBudgets(budgets, month)
  const resetSavingsArr = clearAvailable(prevMonth, prevAmounts, user)
  const currentMonth = resetCurrentMonth(month, currentAmounts, user)
  dispatch(
    applyClientPatch({
      budget: [...removedBudgets, ...resetSavingsArr, ...currentMonth],
    })
  )
}

function removeFutureBudgets(budgets, startDate) {
  const changedArr = []
  for (const month in budgets) {
    if (month > startDate) {
      Object.values(budgets[month]).forEach(budget => {
        changedArr.push(
          makeBudget({ ...budget, outcome: 0, changed: Date.now() })
        )
      })
    }
  }
  return changedArr
}

function clearAvailable(date, amounts, user) {
  const changedArr = []
  fillArray(amounts)
  return changedArr

  function fillArray(amounts) {
    for (const id in amounts) {
      const tag = amounts[id]
      if (tag.available > 0) {
        const budget = makeBudget({
          user,
          date,
          outcome: tag.budgeted - tag.available,
          tag: id,
        })
        changedArr.push(budget)
      }
      if (tag.children) fillArray(tag.children)
    }
  }
}

function resetCurrentMonth(date, amounts, user) {
  const changedArr = []
  const resetTag = (id, { outcome, budgeted, available }) => {
    if ((budgeted || outcome) && outcome !== budgeted)
      changedArr.push(makeBudget({ user, date, outcome, tag: id }))
  }

  for (const parentId in amounts) {
    const tag = amounts[parentId]
    resetTag(parentId, tag)

    for (const childId in tag.children) {
      const child = tag.children[childId]
      resetTag(childId, child)
    }
  }
  return changedArr
}

export const fixOverspends = month => (dispatch, getState) => {
  sendEvent('Budgets: fix overspends')
  const state = getState()
  const user = getRootUser(state).id
  const amounts = getAmountsByTag(state)?.[month]
  const changedBudgets = []

  const addChanges = (tag, outcome) =>
    changedBudgets.push(makeBudget({ user, date: month, outcome, tag }))

  for (const parentId in amounts) {
    const parent = amounts[parentId]
    if (parent.available < 0) {
      let coveredOverspent = 0

      //  Cover overspends only for children with budgets
      if (parent.childrenOverspent) {
        for (const childId in parent.children) {
          const { available, budgeted } = parent.children[childId]
          if (available < 0 && budgeted) {
            coveredOverspent -= available
            const newBudget = budgeted - available
            addChanges(childId, newBudget)
          }
        }
      }

      // Cover left overspend for parent tag
      if (-parent.available !== coveredOverspent) {
        const newBudget = parent.budgeted - parent.available - coveredOverspent
        addChanges(parentId, newBudget)
      }
    }
  }
  dispatch(applyClientPatch({ budget: changedBudgets }))
}
