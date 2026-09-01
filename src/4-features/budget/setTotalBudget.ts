import { round } from '@/6-shared/helpers/money'
import type { AppThunk } from '@/store'

import { core } from '@/zerro-core/redux'

export function setTotalBudget(
  upd: core.budgets.TBudgetUpdate | core.budgets.TBudgetUpdate[]
): AppThunk {
  return (dispatch, getState) => {
    const state = getState()
    const envMetrics = core.activity.selectEnvelopeMetrics(state)
    const updates = Array.isArray(upd) ? upd : [upd]
    const convertFx = core.currency.selectConvertFx(state)

    const adjusted = updates.map(adjustValue)
    dispatch(core.budgets.set(adjusted))

    /** Adjusts budget depending on children budgets */
    function adjustValue(
      u: core.budgets.TBudgetUpdate
    ): core.budgets.TBudgetUpdate {
      const { childrenAssigned, currency } = envMetrics[u.month][u.id]
      const childrenValue = convertFx(childrenAssigned, currency, u.month)
      return { ...u, value: round(u.value - childrenValue) }
    }
  }
}
