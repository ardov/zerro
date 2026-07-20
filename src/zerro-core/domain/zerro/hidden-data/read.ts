import { isISOMonth } from '../../shared/date'
import type { ByMonth } from '../../shared/types'
import type { TDataStore } from '../../zenmoney/store'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TReminder } from '../../zenmoney/reminders'
import { HiddenDataType, THiddenDataComment } from './types'

/** Hidden data lives only in reminder comments, so reads must not depend on wider store slices. */
export type THiddenDataSource = Pick<TDataStore, 'reminder'>

export function parseHiddenDataComment(
  comment: string | null
): THiddenDataComment | null {
  if (!comment) return null
  try {
    const parsed = JSON.parse(comment)
    if (!isHiddenDataComment(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function getSimpleHiddenData<TPayload>(
  data: THiddenDataSource,
  type: HiddenDataType,
  defaultValue: TPayload
): TPayload {
  const reminder = getSimpleHiddenDataReminder(data, type)
  if (!reminder) return defaultValue
  return parseHiddenDataComment(reminder.comment)?.payload as TPayload
}

export function getSimpleHiddenDataReminder(
  data: THiddenDataSource,
  type: HiddenDataType
): TReminder | null {
  return (
    Object.values(data.reminder).find(reminder => {
      const parsed = parseHiddenDataComment(reminder.comment)
      return parsed?.type === type
    }) || null
  )
}

export function getMonthlyHiddenData<TPayload>(
  data: THiddenDataSource,
  type: HiddenDataType
): ByMonth<TPayload> {
  const result: ByMonth<TPayload> = {}
  const reminders = getMonthlyHiddenDataReminders(data, type)

  Object.entries(reminders).forEach(([month, reminder]) => {
    result[month as TISOMonth] = parseHiddenDataComment(reminder.comment)
      ?.payload as TPayload
  })

  return result
}

export function getMonthlyHiddenDataReminders(
  data: THiddenDataSource,
  type: HiddenDataType
): ByMonth<TReminder> {
  const result: ByMonth<TReminder> = {}

  Object.values(data.reminder).forEach(reminder => {
    const parsed = parseHiddenDataComment(reminder.comment)
    if (parsed?.type === type && isISOMonth(parsed.month)) {
      result[parsed.month] = reminder
    }
  })

  return result
}

function isHiddenDataComment(value: unknown): value is THiddenDataComment {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.type === 'string' && 'payload' in record
}
