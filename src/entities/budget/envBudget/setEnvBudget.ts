import { keys } from '@shared/helpers/keys'
import { ByMonth, TEnvelopeId, TISOMonth } from '@shared/types'
import { AppThunk } from '@store/index'
import { budgetStore, TBudgets } from './budgetStore'

export type TEnvBudgetUpdate = {
  id: TEnvelopeId
  month: TISOMonth
  value: number
}

export function setEnvBudget(
  upd: TEnvBudgetUpdate | TEnvBudgetUpdate[]
): AppThunk {
  return (dispatch, getState) => {
    const curentBudgets = budgetStore.getData(getState())
    const updates = Array.isArray(upd) ? upd : [upd]
    if (!upd || !updates.length) return null

    let byMonth: ByMonth<TBudgets> = {}

    updates.forEach(({ id, month, value }) => {
      byMonth[month] ??= {}
      byMonth[month][id] = value
    })

    keys(byMonth).forEach(month => {
      const newData = { ...curentBudgets[month], ...byMonth[month] }
      dispatch(budgetStore.setData(newData, month))
    })
  }
}
