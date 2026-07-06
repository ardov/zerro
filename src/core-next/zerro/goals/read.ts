import type { ByMonth, TDataStore } from '6-shared/types'
import type { TEnvelopeId } from '../envelope-id'
import { getMonthlyHiddenData, HiddenDataType } from '../hidden-data'
import type { TGoal } from './types'

export type TGoals = Record<TEnvelopeId, TGoal | null>

export function getRawGoals(data: TDataStore): ByMonth<TGoals> {
  return getMonthlyHiddenData<TGoals>(data, HiddenDataType.Goals)
}
