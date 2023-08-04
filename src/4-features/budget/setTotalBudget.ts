import { convertFx, round } from '6-shared/helpers/money'
import { AppThunk } from 'store'

import { balances } from '5-entities/envBalances'
import { budgetModel, TBudgetUpdate } from '5-entities/budget'

export function setTotalBudget(upd: TBudgetUpdate | TBudgetUpdate[]): AppThunk {
  return (dispatch, getState) => {
    const state = getState()
    const rateData = balances.rates(state)
    const envMetrics = balances.envData(state)
    const updates = Array.isArray(upd) ? upd : [upd]

    const adjusted = updates.map(adjustValue)
    dispatch(budgetModel.set(adjusted))

    /** Adjusts budget depending on children budgets */
    function adjustValue(u: TBudgetUpdate): TBudgetUpdate {
      const { childrenBudgeted, currency } = envMetrics[u.month][u.id]
      const { rates } = rateData[u.month]
      const childrenValue = convertFx(childrenBudgeted, currency, rates)
      return { ...u, value: round(u.value - childrenValue) }
    }
  }
}
