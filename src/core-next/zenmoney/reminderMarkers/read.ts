import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TReminderMarker } from './types'

export function getReminderMarkers(data: TDataStore): ById<TReminderMarker> {
  return data.reminderMarker
}
