import { sendEvent } from '@shared/helpers/tracking'
import { setEnvelopeBudgets, TBudgetUpdate } from '@entities/budget'
import { AppThunk } from '@store'
import { TISOMonth } from '@shared/types'
import { prevMonth, toISOMonth } from '@shared/helpers/date'
import { getMonthTotals } from '@entities/envelopeData'

export const startFresh =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: start fresh')
    const prevMonthISO = toISOMonth(prevMonth(month))
    dispatch(resetMonthThunk(prevMonthISO))
    dispatch(resetMonthThunk(month))
    dispatch(removeFutureBudgets(month))
  }

/**
 * Removes all budgets after given month
 * @param month
 */
export const removeFutureBudgets =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    let totals = getMonthTotals(getState())
    const updates = Object.values(totals)
      .filter(t => t.month > month)
      .reduce((updates, monthTotals) => {
        return Object.values(monthTotals.envelopes)
          .filter(e => e.selfBudgetedValue)
          .map(e => ({ id: e.id, value: 0, month: monthTotals.month }))
          .concat(updates)
      }, [] as Array<TBudgetUpdate>)
    dispatch(setEnvelopeBudgets(updates))
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
    let totals = getMonthTotals(getState())[month]
    const updates = Object.values(totals.envelopes)
      .filter(e => e.parent) // Only children
      .filter(
        e =>
          e.selfBudgetedValue !== 0 || // has budget
          e.selfAvailableValue > 0 || // has positive balance
          (e.selfAvailableValue < 0 && e.carryNegatives) // carry negatives
      )
      .map(e => ({
        id: e.id,
        value: e.selfBudgetedValue - e.selfAvailableValue,
        month,
      }))
    dispatch(setEnvelopeBudgets(updates))

    // Step 2. Remove parent balances
    let totals2 = getMonthTotals(getState())[month]
    const updates2 = Object.values(totals2.envelopes)
      .filter(e => !e.parent) // Only parents
      .filter(e => e.selfAvailableValue) // with positive available or budget
      .map(e => ({
        id: e.id,
        value: e.selfBudgetedValue - e.selfAvailableValue,
        month,
      }))
    dispatch(setEnvelopeBudgets(updates2))
  }
