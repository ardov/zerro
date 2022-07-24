import { setOneBudget } from 'models/budget'
import { parseEnvelopeId, TEnvelopeId } from 'models/shared/envelopeHelpers'
import { DataEntity, TISOMonth } from 'shared/types'
import { AppThunk } from 'store'
import { budgetStore } from './budgetStore'

export const setEnvelopeBudget =
  (month: TISOMonth, envelopeId: TEnvelopeId, value: number): AppThunk<void> =>
  (dispatch, getState) => {
    const { type, id } = parseEnvelopeId(envelopeId)

    // TODO: calculate self budgets

    // If it is tag-envelope, just set tag budget
    if (type === DataEntity.Tag) {
      return dispatch(setOneBudget(month, id, value))
    }

    const currentBudgetData = budgetStore.getData(getState())[month] || {}
    const newData = { ...currentBudgetData, [envelopeId]: value }
    return dispatch(budgetStore.setData(newData, month))
  }
