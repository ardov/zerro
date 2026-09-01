import type { AppThunk } from '@/store'
import type { TISOMonth, TFxCode } from '@/6-shared/types'

import { round } from '@/6-shared/helpers/money'
import { track } from '@/6-shared/analytics'

import { core } from '@/zerro-core/redux'

export const moveMoney =
  (
    amount: number,
    currency: TFxCode,
    source: core.envelopes.TEnvelopeId | 'toBeAssigned',
    destination: core.envelopes.TEnvelopeId | 'toBeAssigned',
    month: TISOMonth
  ): AppThunk<void> =>
  (dispatch, getState) => {
    if (!source || !amount || !destination || source === destination) return
    const state = getState()
    const metrics = core.activity.selectEnvelopeMetrics(state)[month]
    const convertFx = core.currency.selectConvertFx(state)

    const updates: core.budgets.TBudgetUpdate[] = []

    if (source !== 'toBeAssigned') {
      const env = metrics[source]
      const assigned = env.selfAssigned[env.currency]
      const change =
        env.currency === currency
          ? -amount
          : convertFx({ [currency]: -amount }, env.currency, month)
      const newBudget = round(assigned + change)
      updates.push({ month, id: env.id, value: newBudget })
    }

    if (destination !== 'toBeAssigned') {
      const env = metrics[destination]
      const assigned = env.selfAssigned[env.currency]
      const change =
        env.currency === currency
          ? amount
          : convertFx({ [currency]: amount }, env.currency, month)
      const newBudget = round(assigned + change)
      updates.push({ month, id: env.id, value: newBudget })
    }

    dispatch(core.budgets.set(updates))
    track('budget_funds_moved', {})
  }
