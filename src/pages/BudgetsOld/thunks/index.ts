import { convertCurrency, getInstruments } from '@entities/instrument'
import { getRootUser } from '@entities/user'
import { getPopulatedTag } from '@entities/tag'
import { getAmountsByTag, TagAmounts } from '../selectors'
import { sendEvent } from '@shared/helpers/tracking'
import {
  getBudgets,
  getISOMonthFromBudgetId,
  makeBudget,
} from '@entities/budget'
import { getBudgetsByMonthAndTag, getBudget } from '@entities/budget'
import { getTags } from '@entities/tag'
import { getGoalsProgress } from '../selectors'
import { oldGoalType } from '@entities/old-hiddenData/constants'
import { getGoals } from '@entities/old-hiddenData/goals'
import { applyClientPatch } from '@store/data'
import { AppThunk } from '@store'
import {
  ByIdOld,
  TBudget,
  TBudgetId,
  TDateDraft,
  TISOMonth,
} from '@shared/types'
import { getMetaForTag } from '@entities/old-hiddenData/tagMeta'
import { round } from '@shared/helpers/money'
import { prevMonth, toISODate, toISOMonth } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { getUserInstrumentId } from '@entities/user/model'

export const moveFunds =
  (
    amount: number,
    source: string,
    destination: string,
    month: TISOMonth
  ): AppThunk<void> =>
  (dispatch, getState) => {
    if (!source || !amount || !destination || source === destination) return
    sendEvent('Budgets: move funds')
    const state = getState()
    const user = getRootUser(state)?.id
    if (!user) return

    const resultBudgets: TBudget[] = []
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
        getBudget(state, id, month) ||
        makeBudget({ user: user as number, date: month, tag })
      return {
        ...budget,
        outcome: budget.outcome + outcomeDiff,
        changed: Date.now(),
      }
    }
  }

export const setOutcomeBudget =
  (targetOutcome: number, month: TISOMonth, tagId: string): AppThunk<void> =>
  (dispatch, getState) => {
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
    const userInstrumentId = getUserInstrumentId(state)
    if (!userInstrumentId) return
    const userInstrument = instruments[userInstrumentId]
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

    const budget = created || makeBudget({ user, date: month, tag: tagId })
    const changed = { ...budget, outcome, changed: Date.now() }
    dispatch(applyClientPatch({ budget: [changed] }))
  }

export const copyPreviousBudget =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: copy previous')
    const state = getState()
    const user = getRootUser(state)?.id
    if (!user) return
    const prevMonthISO = toISOMonth(prevMonth(month))
    const tags = getTags(state)
    const budgets = getBudgetsByMonthAndTag(state)
    const currentBudgets = budgets[month]
    const prevBudgets = budgets[prevMonthISO]
    if (!prevBudgets || !tags || !budgets) return

    const changedArr = []
    for (const id in tags) {
      const prevValue = prevBudgets?.[id]?.outcome || 0
      const currentValue = currentBudgets?.[id]?.outcome || 0
      if (prevValue !== currentValue) {
        changedArr.push(
          makeBudget({
            user,
            date: month,
            tag: id,
            outcome: prevValue,
          })
        )
      }
    }
    dispatch(applyClientPatch({ budget: changedArr }))
  }

export const fillGoals =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
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
      if (goals[tag].type === oldGoalType.TARGET_BALANCE && !goals[tag].end)
        continue
      const target = goalsProgress[tag]?.target || 0
      const currentBudget = budgets?.[tag]?.outcome || 0
      if (currentBudget < target) {
        changedArr.push(makeBudget({ user, date: month, tag, outcome: target }))
      }
    }
    dispatch(applyClientPatch({ budget: changedArr }))
  }

export const startFresh =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: start fresh')
    const state = getState()
    const user = getRootUser(state)?.id
    if (!user) return
    const prevMonthISO = toISOMonth(prevMonth(month))
    const budgets = getBudgets(state)
    const amounts = getAmountsByTag(state)
    const prevAmounts = amounts[prevMonthISO]
    const currentAmounts = amounts[month]

    const removedBudgets = removeFutureBudgets(budgets, month)
    const resetSavingsArr = clearAvailable(prevMonthISO, prevAmounts, user)
    const currentMonth = resetCurrentMonth(month, currentAmounts, user)
    dispatch(
      applyClientPatch({
        budget: [...removedBudgets, ...resetSavingsArr, ...currentMonth],
      })
    )
  }

function removeFutureBudgets(
  budgets: Record<TBudgetId, TBudget>,
  startMonth: TISOMonth
): Array<TBudget> {
  const changed = Date.now()
  return keys(budgets)
    .filter(id => getISOMonthFromBudgetId(id) > startMonth)
    .map(id => budgets[id])
    .map(budget => makeBudget({ ...budget, outcome: 0, changed }))
}

function clearAvailable(
  month: TISOMonth,
  amounts: ByIdOld<TagAmounts>,
  user: number
) {
  const changedBudgets: TBudget[] = []
  fillArray(amounts)
  return changedBudgets

  function fillArray(amounts: ByIdOld<TagAmounts>) {
    for (const id in amounts) {
      const tag = amounts[id]
      if (tag.available > 0) {
        const budget = makeBudget({
          user,
          date: toISODate(month),
          outcome: tag.budgeted - tag.available,
          tag: id,
        })
        changedBudgets.push(budget)
      }
      if (tag.children) fillArray(tag.children as ByIdOld<TagAmounts>)
    }
  }
}

function resetCurrentMonth(
  month: TISOMonth,
  amounts: ByIdOld<TagAmounts>,
  user: number
) {
  const changedBudgets: TBudget[] = []
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
      changedBudgets.push(
        makeBudget({ user, date: toISODate(month), outcome, tag: id })
      )
  }
}

export const fixOverspends =
  (month: TDateDraft): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: fix overspends')
    const state = getState()
    const user = getRootUser(state)?.id
    if (!user) return
    const monthISO = toISOMonth(month)
    const amounts = getAmountsByTag(state)?.[monthISO]
    const changedBudgets: TBudget[] = []

    const addChanges = (tag: string, outcome: number) =>
      changedBudgets.push(
        makeBudget({ user, date: toISODate(month), outcome, tag })
      )

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
          const newBudget =
            parent.budgeted - parent.available - coveredOverspent
          addChanges(parentId, newBudget)
        }
      }
    }
    dispatch(applyClientPatch({ budget: changedBudgets }))
  }
