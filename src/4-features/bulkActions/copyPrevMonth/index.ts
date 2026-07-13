import { sendEvent } from '6-shared/helpers/tracking'
import { AppThunk } from 'store'
import { TISOMonth } from '6-shared/types'
import { prevMonth, toISOMonth } from '6-shared/helpers/date'
import {
  activity as coreActivity,
  budgets as coreBudgets,
} from 'zerro-core/redux'

export const copyPreviousBudget =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: copy previous')
    const envData = coreActivity.selectEnvelopeMetrics(getState())
    const curr = envData[month]
    const prev = envData[toISOMonth(prevMonth(month))]

    if (!curr || !prev) return

    const updates: coreBudgets.TBudgetUpdate[] = []
    Object.values(prev).forEach(({ id, currency, selfBudgeted }) => {
      const prevVal = selfBudgeted[currency]
      const currVal = curr[id].selfBudgeted[currency]
      console.assert(
        typeof prevVal === 'number' && typeof currVal === 'number',
        'Value is not number'
      )
      if (prevVal === currVal) return
      updates.push({ id, value: prevVal, month })
    })
    dispatch(coreBudgets.set(updates))
  }
