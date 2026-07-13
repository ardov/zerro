import { add } from '6-shared/helpers/money'
import { sendEvent } from '6-shared/helpers/tracking'
import { TISOMonth } from '6-shared/types'
import { AppThunk } from 'store'
import {
  activity as coreActivity,
  budgets as coreBudgets,
} from 'zerro-core/redux'

import { setTotalBudget } from '4-features/budget/setTotalBudget'

export const fixOverspends =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: fix overspends')

    fixOverspendingChildren()
    fixOverspendingParents()

    function fixOverspendingChildren() {
      const metrics = coreActivity.selectEnvelopeMetrics(getState())[month]
      let childrenUpdates: coreBudgets.TBudgetUpdate[] = []
      Object.values(metrics).forEach(m => {
        if (!m.parent) return
        const budgeted = m.selfBudgeted[m.currency] || 0
        const available = m.selfAvailable[m.currency] || 0
        if (available > 0) return
        if (!budgeted) return
        childrenUpdates.push({
          month,
          id: m.id,
          value: add(budgeted, -available),
        })
      })
      if (childrenUpdates.length) dispatch(setTotalBudget(childrenUpdates))
    }

    function fixOverspendingParents() {
      const metrics = coreActivity.selectEnvelopeMetrics(getState())[month]
      let parentUpdates: coreBudgets.TBudgetUpdate[] = []
      Object.values(metrics).forEach(m => {
        if (m.parent) return
        const totalBudgeted = m.totalBudgeted[m.currency] || 0
        const totalAvailable = m.totalAvailable[m.currency] || 0
        const selfAvailable = m.selfAvailable[m.currency] || 0

        const needForSelf = selfAvailable < 0 ? -selfAvailable : 0
        const needForTotal = totalAvailable < 0 ? -totalAvailable : 0
        const need = Math.max(needForSelf, needForTotal)
        if (!need) return
        parentUpdates.push({
          month,
          id: m.id,
          value: add(totalBudgeted, need),
        })
      })
      if (parentUpdates.length) dispatch(setTotalBudget(parentUpdates))
    }
  }
