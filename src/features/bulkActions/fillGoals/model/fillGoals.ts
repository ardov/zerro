import { sendEvent } from '@shared/helpers/tracking'
import { TISOMonth } from '@shared/types'
import { AppThunk } from '@store'
import { setEnvelopeBudgets, TBudgetUpdate } from '@entities/budget'
import { getMonthTotals } from '@entities/envelopeData'

export const fillGoals =
  (month: TISOMonth): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Budgets: fill goals')
    let state = getState()
    let envelopes = getMonthTotals(state)[month].envelopes
    const updates: TBudgetUpdate[] = []
    Object.values(envelopes).forEach(envelope => {
      if (!envelope.goalNeed || envelope.goalTarget === null) return
      updates.push({ id: envelope.id, value: envelope.goalTarget, month })
    })
    dispatch(setEnvelopeBudgets(updates))
  }
