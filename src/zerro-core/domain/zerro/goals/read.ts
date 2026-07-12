import type { ByMonth } from '../../shared/types'
import type { TEnvelopeId } from '../envelope-id'
import {
  getMonthlyHiddenData,
  HiddenDataType,
  THiddenDataSource,
} from '../hidden-data'
import type { TGoal } from './types'

export type TGoals = Record<TEnvelopeId, TGoal | null>

export function getRawGoals(data: THiddenDataSource): ByMonth<TGoals> {
  return getMonthlyHiddenData<TGoals>(data, HiddenDataType.Goals)
}
