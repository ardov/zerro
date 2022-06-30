import { TEnvelopeId, TRecord } from './types'

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

export function parseEnvelopeId(id: TEnvelopeId) {
  return {
    type: id.split('#')[0],
    id: id.split('#')[1],
  }
}
export function getEnvelopeId(type: string, id: string) {
  return `${type}#${id}` as TEnvelopeId
}
