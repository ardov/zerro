import { balances } from '@entities/envBalances'
import {
  setEnvelopeBudgets,
  TEnvBudgetUpdate,
} from '@features/setEnvelopeBudget'
import { convertFx, round } from '@shared/helpers/money'
import { sendEvent } from '@shared/helpers/tracking'
import { TISOMonth, TEnvelopeId, TFxCode } from '@shared/types'
import { AppThunk } from '@store'

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
    const rates = balances.rates(state)[month].rates
    const metrics = balances.envData(state)[month]

    const updates: TEnvBudgetUpdate[] = []

    if (source !== 'toBeBudgeted') {
      const env = metrics[source]
      const budgeted = env.selfBudgeted[env.currency]
      const change =
        env.currency === currency
          ? -amount
          : convertFx({ [currency]: -amount }, env.currency, rates)
      const newBudget = round(budgeted + change)
      updates.push({ month, id: env.id, value: newBudget, exact: true })
    }

    if (destination !== 'toBeBudgeted') {
      const env = metrics[destination]
      const budgeted = env.selfBudgeted[env.currency]
      const change =
        env.currency === currency
          ? amount
          : convertFx({ [currency]: amount }, env.currency, rates)
      const newBudget = round(budgeted + change)
      updates.push({ month, id: env.id, value: newBudget, exact: true })
    }

    dispatch(setEnvelopeBudgets(updates))
  }
