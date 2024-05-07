import { round } from '6-shared/helpers/money'
import { AppThunk } from 'store'

import { balances } from '5-entities/envBalances'
import { budgetModel, TBudgetUpdate } from '5-entities/budget'
import { fxRateModel } from '5-entities/currency/fxRate'

export function setTotalBudget(upd: TBudgetUpdate | TBudgetUpdate[]): AppThunk {
  return (dispatch, getState) => {
    const state = getState()
    const envMetrics = balances.envData(state)
    const updates = Array.isArray(upd) ? upd : [upd]
    const convertFx = fxRateModel.converter(state)

    const adjusted = updates.map(adjustValue)
    dispatch(budgetModel.set(adjusted))

    /** Adjusts budget depending on children budgets */
    function adjustValue(u: TBudgetUpdate): TBudgetUpdate {
      const { childrenBudgeted, currency } = envMetrics[u.month][u.id]
      const childrenValue = convertFx(childrenBudgeted, currency, u.month)
      return { ...u, value: round(u.value - childrenValue) }
    }
  }
}
