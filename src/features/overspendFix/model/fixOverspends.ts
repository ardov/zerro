import { setEnvelopeBudgets } from 'models/envelopeBudgets'
import { round } from 'shared/helpers/currencyHelpers'
import { sendEvent } from 'shared/helpers/tracking'
import { TISOMonth } from 'shared/types'
import { AppThunk } from 'store'
import { getOverspendsByMonth } from './getOverspends'

export const fixOverspends =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: fix overspends')
    const state = getState()
    const overspendInfo = getOverspendsByMonth(state)[month]

    const updates = overspendInfo.envelopes.map(envelope => ({
      month,
      id: envelope.id,
      value: round(envelope.selfBudgetedValue - envelope.selfAvailableValue),
    }))
    dispatch(setEnvelopeBudgets(updates))
  }
