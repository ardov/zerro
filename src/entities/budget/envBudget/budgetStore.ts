import {
  HiddenDataType,
  makeMonthlyHiddenStore,
} from '@entities/shared/hidden-store'
import { TEnvelopeId } from '@shared/types'

export type TBudgets = Record<TEnvelopeId, number>

export const budgetStore = makeMonthlyHiddenStore<TBudgets>(
  HiddenDataType.Budgets
)

export const getEnvBudgets = budgetStore.getData
