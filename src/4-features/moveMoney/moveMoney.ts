import type { AppThunk } from 'store'
import type { TISOMonth, TFxCode } from '6-shared/types'
import type { TEnvelopeId } from '5-entities/envelope'

import { round } from '6-shared/helpers/money'
import { sendEvent } from '6-shared/helpers/tracking'

import { budgetModel, TBudgetUpdate } from '5-entities/budget'
import { balances } from '5-entities/envBalances'
import { fxRateModel } from '5-entities/currency/fxRate'

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
    sendEvent('Budgets: move funds')
    const state = getState()
    const metrics = balances.envData(state)[month]
    const convertFx = fxRateModel.converter(state)

    const updates: TBudgetUpdate[] = []

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

    dispatch(budgetModel.set(updates))
  }
