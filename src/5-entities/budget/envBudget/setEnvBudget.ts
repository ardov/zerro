import { TEnvelopeId } from '5-entities/envelope'
import { keys } from '6-shared/helpers/keys'
import { ByMonth, TISOMonth } from '6-shared/types'
import { AppThunk } from 'store/index'
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
      // Create month if not exists
      if (!byMonth[month]) {
        // Copy existing month or create new
        if (curentBudgets[month]) byMonth[month] = { ...curentBudgets[month] }
        else byMonth[month] = {}
      }
      if (value) byMonth[month][id] = value
      else delete byMonth[month][id]
    })

    keys(byMonth).forEach(month => {
      dispatch(budgetStore.setData(byMonth[month], month))
    })
  }
}
