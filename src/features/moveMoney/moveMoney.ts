import { setEnvelopeBudgets, TBudgetUpdate } from '@models/budget'
import { getMonthTotals } from '@models/envelopeData'
import { convertFx, round } from '@shared/helpers/money'
import { sendEvent } from '@shared/helpers/tracking'
import { TISOMonth, TEnvelopeId } from '@shared/types'
import { AppThunk } from '@store'

export const moveMoney =
  (
    amount: number,
    source: TEnvelopeId | 'toBeBudgeted',
    destination: TEnvelopeId | 'toBeBudgeted',
    month: TISOMonth
  ): AppThunk<void> =>
  (dispatch, getState) => {
    if (!source || !amount || !destination || source === destination) return
    sendEvent('Budgets: move funds')
    const state = getState()
    const { envelopes, currency, rates } = getMonthTotals(state)[month]

    const updates: TBudgetUpdate[] = []

    if (source !== 'toBeBudgeted') {
      const envelope = envelopes[source]
      const change =
        envelope.currency === currency
          ? -amount
          : convertFx({ [currency]: -amount }, envelope.currency, rates)
      const newBudget = round(envelope.selfBudgetedValue + change)
      updates.push({ month, id: envelope.id, value: newBudget })
    }

    if (destination !== 'toBeBudgeted') {
      const envelope = envelopes[destination]
      const change =
        envelope.currency === currency
          ? amount
          : convertFx({ [currency]: amount }, envelope.currency, rates)
      const newBudget = round(envelope.selfBudgetedValue + change)
      updates.push({ month, id: envelope.id, value: newBudget })
    }

    dispatch(setEnvelopeBudgets(updates))
  }
