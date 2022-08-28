import { sendEvent } from 'shared/helpers/tracking'
import { setEnvelopeBudgets, TBudgetUpdate } from 'models/budget'
import { AppThunk } from 'store'
import { TISOMonth } from 'shared/types'
import { prevMonth, toISOMonth } from 'shared/helpers/date'
import { getMonthTotals } from 'models/envelopeData'

export const copyPreviousBudget =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: copy previous')
    const state = getState()
    const totals = getMonthTotals(state)
    const prevMonthISO = toISOMonth(prevMonth(month))
    const prevEnvelopes = totals[prevMonthISO].envelopes
    const currentEnvelopes = totals[month].envelopes
    const updates: TBudgetUpdate[] = []
    Object.values(prevEnvelopes).forEach(({ id, selfBudgetedValue }) => {
      let prevVal = selfBudgetedValue
      let currVal = currentEnvelopes[id].selfBudgetedValue
      if (prevVal === currVal) return
      updates.push({ id, value: prevVal, month })
    })
    dispatch(setEnvelopeBudgets(updates))
  }
