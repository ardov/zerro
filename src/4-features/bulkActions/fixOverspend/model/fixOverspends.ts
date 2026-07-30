import { add } from '6-shared/helpers/money'
import { track } from '6-shared/analytics'
import type { TISOMonth } from '6-shared/types'
import type { AppThunk } from 'store'
import { core } from 'zerro-core/redux'

import { setTotalBudget } from '4-features/budget/setTotalBudget'

export const fixOverspends =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    fixOverspendingChildren()
    fixOverspendingParents()
    track('budget_automation_applied', { automation: 'fix_overspends' })

    function fixOverspendingChildren() {
      const metrics = core.activity.selectEnvelopeMetrics(getState())[month]
      const childrenUpdates: core.budgets.TBudgetUpdate[] = []
      Object.values(metrics).forEach(m => {
        if (!m.parent) return
        const assigned = m.selfAssigned[m.currency] || 0
        const available = m.selfAvailable[m.currency] || 0
        if (available > 0) return
        if (!assigned) return
        childrenUpdates.push({
          month,
          id: m.id,
          value: add(assigned, -available),
        })
      })
      if (childrenUpdates.length) dispatch(setTotalBudget(childrenUpdates))
    }

    function fixOverspendingParents() {
      const metrics = core.activity.selectEnvelopeMetrics(getState())[month]
      const parentUpdates: core.budgets.TBudgetUpdate[] = []
      Object.values(metrics).forEach(m => {
        if (m.parent) return
        const totalAssigned = m.totalAssigned[m.currency] || 0
        const totalAvailable = m.totalAvailable[m.currency] || 0
        const selfAvailable = m.selfAvailable[m.currency] || 0

        const needForSelf = selfAvailable < 0 ? -selfAvailable : 0
        const needForTotal = totalAvailable < 0 ? -totalAvailable : 0
        const need = Math.max(needForSelf, needForTotal)
        if (!need) return
        parentUpdates.push({
          month,
          id: m.id,
          value: add(totalAssigned, need),
        })
      })
      if (parentUpdates.length) dispatch(setTotalBudget(parentUpdates))
    }
  }
