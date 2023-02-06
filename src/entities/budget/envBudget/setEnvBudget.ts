import { TEnvelopeId } from '@entities/envelope'
import { keys } from '@shared/helpers/keys'
import { ByMonth, TISOMonth } from '@shared/types'
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
      byMonth[month] ??= { ...curentBudgets[month] } || {}
      if (value) byMonth[month][id] = value
      else delete byMonth[month][id]
    })

    keys(byMonth).forEach(month => {
      dispatch(budgetStore.setData(byMonth[month], month))
    })
  }
}
