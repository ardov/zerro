import { TEnvelopeId } from '5-entities/envelope'
import {
  HiddenDataType,
  makeMonthlyHiddenStore,
} from '5-entities/shared/hidden-store'

export type TBudgets = Record<TEnvelopeId, number>

export const budgetStore = makeMonthlyHiddenStore<TBudgets>(
  HiddenDataType.Budgets
)

export const getEnvBudgets = budgetStore.getData
