import { sendEvent } from '@shared/helpers/tracking'
import { AppThunk } from '@store'
import { TISOMonth } from '@shared/types'
import { prevMonth, toISOMonth } from '@shared/helpers/date'
import { balances } from '@entities/envBalances'
import {
  setEnvelopeBudgets,
  TEnvBudgetUpdate,
} from '@features/setEnvelopeBudget'

export const copyPreviousBudget =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: copy previous')
    const envData = balances.envData(getState())
    const curr = envData[month]
    const prev = envData[toISOMonth(prevMonth(month))]

    if (!curr || !prev) return

    const updates: TEnvBudgetUpdate[] = []
    Object.values(prev).forEach(({ id, currency, selfBudgeted }) => {
      let prevVal = selfBudgeted[currency]
      let currVal = curr[id].selfBudgeted[currency]
      console.assert(
        typeof prevVal === 'number' && typeof currVal === 'number',
        'Value is not number'
      )
      if (prevVal === currVal) return
      updates.push({ id, value: prevVal, month })
    })
    dispatch(setEnvelopeBudgets(updates))
  }
