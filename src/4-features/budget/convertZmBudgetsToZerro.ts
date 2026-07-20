import { toISOMonth } from '6-shared/helpers/date'
import type { ById, TBudget } from '6-shared/types'
import { globalBudgetTagId } from '6-shared/types'
import { core } from 'zerro-core/redux'

import type { AppThunk } from 'store'

export function convertZmBudgetsToZerro(): AppThunk<
  core.budgets.TBudgetUpdate[]
> {
  return (dispatch, getState) => {
    const tagBudgets = core.budgets.selectRaw(getState())
    const updates = convertTagBudgetsToUpdates(tagBudgets)
    dispatch(core.budgets.set(updates))
    return updates
  }
}

function convertTagBudgetsToUpdates(tagBudgets: ById<TBudget>) {
  const updates = [] as core.budgets.TBudgetUpdate[]

  Object.values(tagBudgets).forEach(budget => {
    if (!budget.outcome) return
    if (budget.tag === globalBudgetTagId) return
    updates.push({
      id: core.envelopes.envId.get(
        core.envelopes.EnvType.Tag,
        String(budget.tag)
      ),
      month: toISOMonth(budget.date),
      value: budget.outcome,
    })
  })

  return updates
}
