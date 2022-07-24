import { HiddenDataType, makeMonthlyHiddenStore } from 'models/hidden-store'
import { TEnvelopeId } from 'models/shared/envelopeHelpers'

export type TBudgets = Record<TEnvelopeId, number>

export const budgetStore = makeMonthlyHiddenStore<TBudgets>(
  HiddenDataType.Budgets
)
