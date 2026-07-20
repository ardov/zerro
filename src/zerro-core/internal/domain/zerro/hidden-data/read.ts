import { isISOMonth } from '../../foundation/date'
import type { ById, ByMonth } from '../../foundation/types'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TReminder } from '../../zenmoney/entities/reminders'
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
  reminders: ById<TReminder>,
  type: HiddenDataType,
  defaultValue: TPayload
): TPayload {
  const reminder = getSimpleHiddenDataReminder(reminders, type)
  if (!reminder) return defaultValue
  return parseHiddenDataComment(reminder.comment)?.payload as TPayload
}

export function getSimpleHiddenDataReminder(
  reminders: ById<TReminder>,
  type: HiddenDataType
): TReminder | null {
  return (
    Object.values(reminders).find(reminder => {
      const parsed = parseHiddenDataComment(reminder.comment)
      return parsed?.type === type
    }) || null
  )
}

export function getMonthlyHiddenData<TPayload>(
  reminders: ById<TReminder>,
  type: HiddenDataType
): ByMonth<TPayload> {
  const result: ByMonth<TPayload> = {}
  const remindersByMonth = getMonthlyHiddenDataReminders(reminders, type)

  Object.entries(remindersByMonth).forEach(([month, reminder]) => {
    result[month as TISOMonth] = parseHiddenDataComment(reminder.comment)
      ?.payload as TPayload
  })

  return result
}

export function getMonthlyHiddenDataReminders(
  reminders: ById<TReminder>,
  type: HiddenDataType
): ByMonth<TReminder> {
  const result: ByMonth<TReminder> = {}

  Object.values(reminders).forEach(reminder => {
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
