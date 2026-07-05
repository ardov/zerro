import { isISOMonth } from '6-shared/helpers/date'
import type { ByMonth, TDataStore, TISOMonth, TReminder } from '6-shared/types'
import { HiddenDataType, THiddenDataComment } from './types'

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
  data: TDataStore,
  type: HiddenDataType,
  defaultValue: TPayload
): TPayload {
  const reminder = getSimpleHiddenDataReminder(data, type)
  if (!reminder) return defaultValue
  return parseHiddenDataComment(reminder.comment)?.payload as TPayload
}

export function getSimpleHiddenDataReminder(
  data: TDataStore,
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
  data: TDataStore,
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
  data: TDataStore,
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
