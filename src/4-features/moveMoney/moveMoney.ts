import { convertFx, round } from '6-shared/helpers/money'
import { sendEvent } from '6-shared/helpers/tracking'
import { TISOMonth, TFxCode } from '6-shared/types'
import { AppThunk } from 'store'
import { budgetModel, TBudgetUpdate } from '5-entities/budget'
import { balances } from '5-entities/envBalances'
import { TEnvelopeId } from '5-entities/envelope'

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

    const updates: TBudgetUpdate[] = []

    if (source !== 'toBeBudgeted') {
      const env = metrics[source]
      const budgeted = env.selfBudgeted[env.currency]
      const change =
        env.currency === currency
          ? -amount
          : convertFx({ [currency]: -amount }, env.currency, rates)
      const newBudget = round(budgeted + change)
      updates.push({ month, id: env.id, value: newBudget })
    }

    if (destination !== 'toBeBudgeted') {
      const env = metrics[destination]
      const budgeted = env.selfBudgeted[env.currency]
      const change =
        env.currency === currency
          ? amount
          : convertFx({ [currency]: amount }, env.currency, rates)
      const newBudget = round(budgeted + change)
      updates.push({ month, id: env.id, value: newBudget })
    }

    dispatch(budgetModel.set(updates))
  }
