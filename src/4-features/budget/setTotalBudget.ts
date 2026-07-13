import { round } from '6-shared/helpers/money'
import { AppThunk } from 'store'

import {
  activity as coreActivity,
  budgets as coreBudgets,
  currency as coreCurrency,
} from 'zerro-core/redux'

export function setTotalBudget(
  upd: coreBudgets.TBudgetUpdate | coreBudgets.TBudgetUpdate[]
): AppThunk {
  return (dispatch, getState) => {
    const state = getState()
    const envMetrics = coreActivity.selectEnvelopeMetrics(state)
    const updates = Array.isArray(upd) ? upd : [upd]
    const convertFx = coreCurrency.selectConvertFx(state)

    const adjusted = updates.map(adjustValue)
    dispatch(coreBudgets.set(adjusted))

    /** Adjusts budget depending on children budgets */
    function adjustValue(
      u: coreBudgets.TBudgetUpdate
    ): coreBudgets.TBudgetUpdate {
      const { childrenBudgeted, currency } = envMetrics[u.month][u.id]
      const childrenValue = convertFx(childrenBudgeted, currency, u.month)
      return { ...u, value: round(u.value - childrenValue) }
    }
  }
}
