import { createSelector } from '@reduxjs/toolkit'
import { round } from 'shared/helpers/currencyHelpers'
import { RootState } from 'models'
import { convertCurrency } from 'models/instrument'
import { TPopulatedBudget, TBudgetId } from './types'
import { TDateDraft, TISOMonth } from 'shared/types'
import { getTagMeta } from '../hiddenData/tagMeta'
import { getBudgetId } from './getBudgetId'
import { toISOMonth } from 'shared/helpers/date'
import { keys } from 'shared/helpers/keys'
import { TTagId } from 'models/tag'

export const getBudgets = (state: RootState) => state.data.current.budget

export const getBudget = (state: RootState, tag: TTagId, month: TDateDraft) =>
  getBudgets(state)[getBudgetId(month, tag)]

const getPopulatedBudgets = createSelector(
  [getBudgets, getTagMeta, convertCurrency],
  (budgets, meta, convert) => {
    let result: Record<TBudgetId, TPopulatedBudget> = {}
    keys(budgets).forEach(id => {
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
    })
    return result
  }
)

export const getBudgetsByMonthAndTag = createSelector(
  [getPopulatedBudgets],
  budgets => {
    // TODO: DATE FORMAT
    let result: { [month: TISOMonth]: Record<TTagId, TPopulatedBudget> } = {}
    keys(budgets).forEach(id => {
      const { date, tag, outcome } = budgets[id]
      // skip old goals
      if (date <= '2002-01-01') return
      if (!outcome) return
      let month = toISOMonth(date)
      result[month] ??= {}
      result[month][String(tag)] = budgets[id]
    })
    return result
  }
)
