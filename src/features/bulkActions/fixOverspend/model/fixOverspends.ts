import { round } from '@shared/helpers/money'
import { sendEvent } from '@shared/helpers/tracking'
import { TISOMonth } from '@shared/types'
import { AppThunk } from '@store'
import { balances } from '@entities/envBalances'
import {
  setEnvelopeBudgets,
  TEnvBudgetUpdate,
} from '@features/setEnvelopeBudget'

export const fixOverspends =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: fix overspends')
    const metrics = balances.envData(getState())[month]
    let updates: TEnvBudgetUpdate[] = []

    Object.values(metrics).forEach(m => {
      if (!m.parent) return
      const budgeted = m.selfBudgeted[m.currency] || 0
      const available = m.selfAvailable[m.currency] || 0
      if (available > 0) return
      updates.push({
        month,
        id: m.id,
        value: round(budgeted - available),
      })
    })
    dispatch(setEnvelopeBudgets(updates))
  }
