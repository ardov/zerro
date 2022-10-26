import { sendEvent } from '@shared/helpers/tracking'
import { TISOMonth } from '@shared/types'
import { prevMonth, toISOMonth } from '@shared/helpers/date'
import { AppThunk } from '@store'

import {
  setEnvelopeBudgets,
  TEnvBudgetUpdate,
} from '@features/setEnvelopeBudget'
import { balances } from '@entities/envBalances'
import { keys } from '@shared/helpers/keys'
import { isZero } from '@shared/helpers/money'

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
 * @param targetMonth
 */
export const removeFutureBudgets =
  (targetMonth: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    const envData = balances.envData(getState())
    const updates = keys(envData)
      .filter(month => month > targetMonth)
      .reduce((updates, month) => {
        return Object.values(envData[month])
          .filter(e => !isZero(e.selfBudgeted))
          .map(e => ({ id: e.id, value: 0, month }))
          .concat(updates)
      }, [] as Array<TEnvBudgetUpdate>)
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
    const envData = balances.envData(getState())[month]
    const updates = Object.values(envData)
      .filter(e => e.parent) // Only children
      .filter(e => {
        let available = e.selfAvailable[e.currency]
        if (!available) return false // already empty
        if (available > 0 || e.carryNegatives) return true // has something to carry
        return false
      })
      .map(e => ({
        id: e.id,
        value: e.selfBudgeted[e.currency] - e.selfAvailable[e.currency],
        month,
      }))
    dispatch(setEnvelopeBudgets(updates))

    // Step 2. Remove parent balances
    const envData2 = balances.envData(getState())[month]
    const updates2 = Object.values(envData2)
      .filter(e => !e.parent) // Only parents
      .filter(e => !isZero(e.selfAvailable)) // with positive available
      .map(e => ({
        id: e.id,
        value: e.selfBudgeted[e.currency] - e.selfAvailable[e.currency],
        month,
      }))
    dispatch(setEnvelopeBudgets(updates2))
  }
