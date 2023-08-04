import { sendEvent } from '6-shared/helpers/tracking'
import { AppThunk } from 'store'
import { TISOMonth } from '6-shared/types'
import { prevMonth, toISOMonth } from '6-shared/helpers/date'
import { balances } from '5-entities/envBalances'
import { TBudgetUpdate } from '5-entities/budget'
import { setBudget } from '5-entities/budget/setBudget'

export const copyPreviousBudget =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: copy previous')
    const envData = balances.envData(getState())
    const curr = envData[month]
    const prev = envData[toISOMonth(prevMonth(month))]

    if (!curr || !prev) return

    const updates: TBudgetUpdate[] = []
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
    dispatch(setBudget(updates))
  }
