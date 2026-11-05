import type { ById, ByMonth } from '../../foundation/types'
import type { TReminder } from '../../zenmoney/entities/reminders'
import type { TEnvelopeId } from '../envelope-id'
import { getMonthlyHiddenData, HiddenDataType } from '../hidden-data'

export type TBudgets = Record<TEnvelopeId, number>

export function getEnvBudgets(reminders: ById<TReminder>): ByMonth<TBudgets> {
  return getMonthlyHiddenData<TBudgets>(reminders, HiddenDataType.Budgets)
}
