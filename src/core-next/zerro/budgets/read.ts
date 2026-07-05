import type { ByMonth, TDataStore } from '6-shared/types'
import type { TEnvelopeId } from '../envelope-id'
import { getMonthlyHiddenData, HiddenDataType } from '../hidden-data'

export type TBudgets = Record<TEnvelopeId, number>

export function getEnvBudgets(data: TDataStore): ByMonth<TBudgets> {
  return getMonthlyHiddenData<TBudgets>(data, HiddenDataType.Budgets)
}
