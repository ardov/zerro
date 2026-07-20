import { track } from '6-shared/analytics'
import type { AppThunk } from 'store'
import type { TISOMonth } from '6-shared/types'
import { prevMonth, toISOMonth } from '6-shared/helpers/date'
import { core } from 'zerro-core/redux'

export const copyPreviousBudget =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    const envData = core.activity.selectEnvelopeMetrics(getState())
    const curr = envData[month]
    const prev = envData[toISOMonth(prevMonth(month))]

    if (!curr || !prev) return

    const updates: core.budgets.TBudgetUpdate[] = []
    Object.values(prev).forEach(({ id, currency, selfBudgeted }) => {
      const prevVal = selfBudgeted[currency]
      const currVal = curr[id].selfBudgeted[currency]
      console.assert(
        typeof prevVal === 'number' && typeof currVal === 'number',
        'Value is not number'
      )
      if (prevVal === currVal) return
      updates.push({ id, value: prevVal, month })
    })
    dispatch(core.budgets.set(updates))
    track('budget_automation_applied', { automation: 'copy_previous' })
  }
