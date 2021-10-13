import { createSelector } from '@reduxjs/toolkit'
import { round } from 'helpers/currencyHelpers'
import { formatDate } from 'helpers/format'
import { RootState } from 'store'
import { convertCurrency } from 'store/data/selectors'
import { ById, PopulatedBudget, TagId } from 'types'
import { getTagMeta } from '../hiddenData/tagMeta'

// Goal data was hidden in budgets for this date
const goalBudgetDate = +new Date(2000, 0)

const getBudgets = (state: RootState) => state.data.current.budget

const getBudget = (state: RootState, tag: TagId, month: Date | number) =>
  getBudgets(state)[`${tag},${formatDate(month, 'yyyy-MM-dd')}`]

const getPopulatedBudgets = createSelector(
  [getBudgets, getTagMeta, convertCurrency],
  (budgets, meta, convert) => {
    let result: ById<PopulatedBudget> = {}
    for (const id in budgets) {
      const budget = budgets[id]
      const { tag, outcome } = budget
      const instrument = meta[tag || 'null']?.currency || null

      result[id] = {
        ...budget,
        instrument,
        convertedOutcome: instrument
          ? round(convert(outcome, instrument))
          : outcome,
      }
    }
    return result
  }
)

const getBudgetsByMonthAndTag = createSelector(
  [getPopulatedBudgets],
  budgets => {
    let result: { [month: number]: ById<PopulatedBudget> } = {}
    for (const key in budgets) {
      const { date, tag, outcome } = budgets[key]
      // skip old goals
      if (date === goalBudgetDate || !outcome) continue
      if (!outcome) continue
      if (!result[date]) result[date] = {}
      result[date][String(tag)] = budgets[key]
    }
    return result
  }
)

export const selectors = {
  getBudgetsByMonthAndTag,
  getBudget,
}
