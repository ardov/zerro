import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TReminder } from './types'

export function getReminders(data: TDataStore): ById<TReminder> {
  return data.reminder
}
