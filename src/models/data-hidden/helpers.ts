import { TISODate } from 'shared/types'
import { RecordType } from './types'

export function parseComment(comment: string | null) {
  if (!comment) return null
  try {
    return JSON.parse(comment)
  } catch {
    return null
  }
}
export function getRecordId(type: RecordType, date?: TISODate) {
  return date ? `${type}#${date}` : type
}
