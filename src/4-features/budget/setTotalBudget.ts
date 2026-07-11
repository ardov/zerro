import { round } from '6-shared/helpers/money'
import { AppThunk } from 'store'

import {
  selectCoreEnvMetrics,
  setBudget,
  type TBudgetUpdate,
} from 'core-next/adapters/redux'
import { fxRateModel } from '5-entities/currency/fxRate'

export function setTotalBudget(upd: TBudgetUpdate | TBudgetUpdate[]): AppThunk {
  return (dispatch, getState) => {
    const state = getState()
    const envMetrics = selectCoreEnvMetrics(state)
    const updates = Array.isArray(upd) ? upd : [upd]
    const convertFx = fxRateModel.converter(state)

    const adjusted = updates.map(adjustValue)
    dispatch(setBudget(adjusted))

    /** Adjusts budget depending on children budgets */
    function adjustValue(u: TBudgetUpdate): TBudgetUpdate {
      const { childrenBudgeted, currency } = envMetrics[u.month][u.id]
      const childrenValue = convertFx(childrenBudgeted, currency, u.month)
      return { ...u, value: round(u.value - childrenValue) }
    }
  }
}
