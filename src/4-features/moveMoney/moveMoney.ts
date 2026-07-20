import type { AppThunk } from 'store'
import type { TISOMonth, TFxCode } from '6-shared/types'
import type { TEnvelopeId } from '5-entities/envelope'

import { round } from '6-shared/helpers/money'
import { track } from '6-shared/analytics'

import * as core from 'zerro-core/redux'

export const moveMoney =
  (
    amount: number,
    currency: TFxCode,
    source: TEnvelopeId | 'toBeBudgeted',
    destination: TEnvelopeId | 'toBeBudgeted',
    month: TISOMonth
  ): AppThunk<void> =>
  (dispatch, getState) => {
    if (!source || !amount || !destination || source === destination) return
    const state = getState()
    const metrics = core.activity.selectEnvelopeMetrics(state)[month]
    const convertFx = core.currency.selectConvertFx(state)

    const updates: core.budgets.TBudgetUpdate[] = []

    if (source !== 'toBeBudgeted') {
      const env = metrics[source]
      const budgeted = env.selfBudgeted[env.currency]
      const change =
        env.currency === currency
          ? -amount
          : convertFx({ [currency]: -amount }, env.currency, month)
      const newBudget = round(budgeted + change)
      updates.push({ month, id: env.id, value: newBudget })
    }

    if (destination !== 'toBeBudgeted') {
      const env = metrics[destination]
      const budgeted = env.selfBudgeted[env.currency]
      const change =
        env.currency === currency
          ? amount
          : convertFx({ [currency]: amount }, env.currency, month)
      const newBudget = round(budgeted + change)
      updates.push({ month, id: env.id, value: newBudget })
    }

    dispatch(core.budgets.set(updates))
    track('budget_funds_moved', {})
  }
