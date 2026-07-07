import type { ById, TDataStore } from '6-shared/types'
import type { TReminder } from './types'

export function getReminders(data: TDataStore): ById<TReminder> {
  return data.reminder
}
