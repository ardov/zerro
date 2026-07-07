import type { ById, TDataStore } from '6-shared/types'
import type { TReminderMarker } from './types'

export function getReminderMarkers(data: TDataStore): ById<TReminderMarker> {
  return data.reminderMarker
}
