import type { ById, ByMonth } from '../../foundation/types'
import type { TReminder } from '../../zenmoney/entities/reminders'
import type { TEnvelopeId } from '../envelope-id'
import { getMonthlyHiddenData, HiddenDataType } from '../hidden-data'
import type { TGoal } from './types'

export type TGoals = Record<TEnvelopeId, TGoal | null>

export function getRawGoals(reminders: ById<TReminder>): ByMonth<TGoals> {
  return getMonthlyHiddenData<TGoals>(reminders, HiddenDataType.Goals)
}
