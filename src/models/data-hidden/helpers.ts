import { TRecord } from './types'

export function parseComment(comment: string | null) {
  if (!comment) return null
  try {
    return JSON.parse(comment)
  } catch {
    return null
  }
}

export function getRecordId(record: TRecord) {
  if ('date' in record) {
    return `${record.type}#${record.date}`
  }
  return record.type
}
