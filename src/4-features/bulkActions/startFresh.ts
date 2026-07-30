import { track } from '6-shared/analytics'
import type { TISOMonth } from '6-shared/types'
import { prevMonth, toISOMonth } from '6-shared/helpers/date'
import { keys } from '6-shared/helpers/keys'
import { isZero } from '6-shared/helpers/money'
import type { AppThunk } from 'store'

import { core } from 'zerro-core/redux'

import { setTotalBudget } from '4-features/budget/setTotalBudget'

export const startFresh =
  (month: TISOMonth): AppThunk<void> =>
  dispatch => {
    const prevMonthISO = toISOMonth(prevMonth(month))
    dispatch(resetMonthThunk(prevMonthISO))
    dispatch(resetMonthThunk(month))
    dispatch(removeFutureBudgets(month))
    track('budget_automation_applied', { automation: 'start_fresh' })
  }

/**
 * Removes all budgets after given month
 * @param targetMonth
 */
export const removeFutureBudgets =
  (targetMonth: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    const envData = core.activity.selectEnvelopeMetrics(getState())
    const updates = keys(envData)
      .filter(month => month > targetMonth)
      .reduce((updates, month) => {
        return Object.values(envData[month])
          .filter(e => !isZero(e.selfAssigned))
          .map(e => ({ id: e.id, value: 0, month }))
          .concat(updates)
      }, [] as Array<core.budgets.TBudgetUpdate>)
    dispatch(setTotalBudget(updates))
  }

/**
 * Resets all balances for selected month
 *
 * `Step 1.` Remove children balances.
 * In most cases we will cover all balances in parent envelope but there are exceptions:
 * - Child has budget
 * - Child has positive balance (usually means it once had its own budget)
 * - Child carry negatives (to prevent carrying we will reset balance)
 *
 * `Step 2.` Remove parent balances.
 * All left overspends will be covered here
 * @param month
 */
export const resetMonthThunk =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    // Step 1. Remove children balances
    const envData = core.activity.selectEnvelopeMetrics(getState())[month]
    const updates = Object.values(envData)
      .filter(e => e.parent) // Only children
      .filter(e => {
        const available = e.selfAvailable[e.currency]
        if (!available) return false // already empty
        return true
      })
      .map(e => ({
        id: e.id,
        value: e.totalAssigned[e.currency] - e.selfAvailable[e.currency],
        month,
      }))
    dispatch(setTotalBudget(updates))

    // Step 2. Remove parent balances
    const envData2 = core.activity.selectEnvelopeMetrics(getState())[month]
    const updates2 = Object.values(envData2)
      .filter(e => !e.parent) // Only parents
      .filter(e => !isZero(e.selfAvailable)) // with positive available
      .map(e => ({
        id: e.id,
        value: e.totalAssigned[e.currency] - e.selfAvailable[e.currency],
        month,
      }))
    dispatch(setTotalBudget(updates2))
  }
