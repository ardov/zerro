import {
  convertCurrency,
  getInstruments,
  getUserInstrument,
} from 'store/data/instruments'
import { getRootUser } from 'store/data/users'
import { getPopulatedTag } from 'store/data/tags'
import { getAmountsByTag, TagAmounts } from '../selectors'
import { sendEvent } from 'helpers/tracking'
import { makeBudget } from 'store/data/budgets'
import { getBudgetsByMonthAndTag, getBudget } from 'store/data/budgets'
import { getTags } from 'store/data/tags'
import { subMonths } from 'date-fns/esm'
import { getGoalsProgress } from '../selectors/goalsProgress'
import { goalType } from 'store/data/hiddenData/constants'
import { getGoals } from 'store/data/hiddenData/goals'
import { applyClientPatch } from 'store/data'
import { AppThunk } from 'store'
import { Budget, ById } from 'types'
import { getMetaForTag } from 'store/data/hiddenData/tagMeta'
import { round } from 'helpers/currencyHelpers'

export const moveFunds = (
  amount: number,
  source: string,
  destination: string,
  monthDate: number
): AppThunk => (dispatch, getState) => {
  if (!source || !amount || !destination || source === destination) return
  sendEvent('Budgets: move funds')
  const state = getState()
  const user = getRootUser(state)?.id
  if (!user) return

  const resultBudgets: Budget[] = []
  if (source !== 'toBeBudgeted') {
    resultBudgets.push(getUpdatedBudget(source, -amount))
  }
  if (destination !== 'toBeBudgeted') {
    resultBudgets.push(getUpdatedBudget(destination, amount))
  }
  dispatch(applyClientPatch({ budget: resultBudgets }))

  function getUpdatedBudget(id: string, outcomeDiff: number) {
    const tag = id === 'null' ? null : id
    const budget =
      getBudget(state, id, monthDate) ||
      makeBudget({ user: user as number, date: +monthDate, tag })
    return {
      ...budget,
      outcome: budget.outcome + outcomeDiff,
      changed: Date.now(),
    }
  }
}

export const setOutcomeBudget = (
  targetOutcome: number,
  month: number,
  tagId: string
): AppThunk => (dispatch, getState) => {
  sendEvent('Budgets: set budget')
  const state = getState()
  const user = getRootUser(state)?.id
  if (!user) return
  const created = getBudget(state, tagId, month)
  const amounts = getAmountsByTag(state)[month]
  const parentTagId = getPopulatedTag(state, tagId).parent

  // ------------------------------------------------------------------
  // Currency part. Refactor me, pls 🥺
  const currConverter = convertCurrency(state)
  const { currency } = getMetaForTag(tagId)(state)
  const instruments = getInstruments(state)
  const userInstrument = getUserInstrument(state)
  const tagInstrument = currency ? instruments[currency] : userInstrument
  const toTagCurrency = (v: number) =>
    v && tagInstrument && userInstrument
      ? round(currConverter(v, userInstrument.id, tagInstrument.id))
      : v
  // End of currency part
  // ------------------------------------------------------------------

  let outcome = targetOutcome

  if (!parentTagId) {
    // if it's top level category
    const { budgeted, totalBudgeted } = amounts[tagId]
    const childrenBudgets = totalBudgeted - budgeted
    outcome = targetOutcome - toTagCurrency(childrenBudgets)
  }

  const budget = created || makeBudget({ user, date: +month, tag: tagId })
  const changed = { ...budget, outcome, changed: Date.now() }
  dispatch(applyClientPatch({ budget: [changed] }))
}

export const copyPreviousBudget = (month: number): AppThunk => (
  dispatch,
  getState
) => {
  sendEvent('Budgets: copy previous')
  const state = getState()
  const user = getRootUser(state)?.id
  if (!user) return
  const tags = getTags(state)
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

export const fillGoals = (month: number): AppThunk => (dispatch, getState) => {
  sendEvent('Budgets: fill goals')
  const state = getState()
  const user = getRootUser(state)?.id
  if (!user) return
  const goalsProgress = getGoalsProgress(state)?.[month]
  const tags = getTags(state)
  const budgets = getBudgetsByMonthAndTag(state)?.[month]
  const goals = getGoals(state)

  if (!goalsProgress || !tags) return

  const changedArr = []
  for (const tag in goalsProgress) {
    if (goals[tag].type === goalType.TARGET_BALANCE && !goals[tag].end) continue
    const target = goalsProgress[tag]?.target || 0
    const currentBudget = budgets?.[tag]?.outcome || 0
    if (currentBudget < target) {
      changedArr.push(makeBudget({ user, date: +month, tag, outcome: target }))
    }
  }
  dispatch(applyClientPatch({ budget: changedArr }))
}

export const startFresh = (month: number): AppThunk => (dispatch, getState) => {
  sendEvent('Budgets: start fresh')
  const state = getState()
  const user = getRootUser(state)?.id
  if (!user) return
  const prevMonth = +subMonths(month, 1)
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

function removeFutureBudgets(
  budgets: ReturnType<typeof getBudgetsByMonthAndTag>,
  startDate: number
) {
  const changedArr: Budget[] = []
  for (const month in budgets) {
    if (+month > startDate) {
      Object.values(budgets[month]).forEach(budget => {
        changedArr.push(
          makeBudget({ ...budget, outcome: 0, changed: Date.now() })
        )
      })
    }
  }
  return changedArr
}

function clearAvailable(date: number, amounts: ById<TagAmounts>, user: number) {
  const changedBudgets: Budget[] = []
  fillArray(amounts)
  return changedBudgets

  function fillArray(amounts: ById<TagAmounts>) {
    for (const id in amounts) {
      const tag = amounts[id]
      if (tag.available > 0) {
        const budget = makeBudget({
          user,
          date,
          outcome: tag.budgeted - tag.available,
          tag: id,
        })
        changedBudgets.push(budget)
      }
      if (tag.children) fillArray(tag.children as ById<TagAmounts>)
    }
  }
}

function resetCurrentMonth(
  date: number,
  amounts: ById<TagAmounts>,
  user: number
) {
  const changedBudgets: Budget[] = []
  for (const parentId in amounts) {
    const tag = amounts[parentId]
    resetTag(parentId, tag)
    for (const childId in tag.children) {
      const child = tag.children[childId]
      resetTag(childId, child)
    }
  }
  return changedBudgets

  function resetTag(id: string, tagAmounts: TagAmounts) {
    const { outcome, budgeted } = tagAmounts
    if ((budgeted || outcome) && outcome !== budgeted)
      changedBudgets.push(makeBudget({ user, date, outcome, tag: id }))
  }
}

export const fixOverspends = (month: number): AppThunk => (
  dispatch,
  getState
) => {
  sendEvent('Budgets: fix overspends')
  const state = getState()
  const user = getRootUser(state)?.id
  if (!user) return
  const amounts = getAmountsByTag(state)?.[month]
  const changedBudgets: Budget[] = []

  const addChanges = (tag: string, outcome: number) =>
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
