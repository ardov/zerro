import { HiddenDataType, makeMonthlyHiddenStore } from '@entities/hidden-store'
import { TEnvelopeId } from '@shared/types'

export type TBudgets = Record<TEnvelopeId, number>

export const budgetStore = makeMonthlyHiddenStore<TBudgets>(
  HiddenDataType.Budgets
)
