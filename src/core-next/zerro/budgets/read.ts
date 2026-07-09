import type { ByMonth } from '6-shared/types'
import type { TEnvelopeId } from '../envelope-id'
import {
  getMonthlyHiddenData,
  HiddenDataType,
  THiddenDataSource,
} from '../hidden-data'

export type TBudgets = Record<TEnvelopeId, number>

export function getEnvBudgets(data: THiddenDataSource): ByMonth<TBudgets> {
  return getMonthlyHiddenData<TBudgets>(data, HiddenDataType.Budgets)
}
