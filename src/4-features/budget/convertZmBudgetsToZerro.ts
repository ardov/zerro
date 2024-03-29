import { toISOMonth } from '6-shared/helpers/date'
import { ById, TBudget, globalBudgetTagId } from '6-shared/types'
import { getTagBudgets, setEnvBudget, TBudgetUpdate } from '5-entities/budget'
import { envelopeModel, EnvType } from '5-entities/envelope'
import { AppThunk } from 'store'

export function convertZmBudgetsToZerro(): AppThunk<TBudgetUpdate[]> {
  return (dispatch, getState) => {
    const tagBudgets = getTagBudgets(getState())
    const updates = convertTagBudgetsToUpdates(tagBudgets)
    dispatch(setEnvBudget(updates))
    return updates
  }
}

function convertTagBudgetsToUpdates(tagBudgets: ById<TBudget>) {
  let updates = [] as TBudgetUpdate[]

  Object.values(tagBudgets).forEach(budget => {
    if (!budget.outcome) return
    if (budget.tag === globalBudgetTagId) return
    updates.push({
      id: envelopeModel.makeId(EnvType.Tag, String(budget.tag)),
      month: toISOMonth(budget.date),
      value: budget.outcome,
    })
  })

  return updates
}
