import { TEnvelopeId, TEnvelopeType } from '@shared/types'

export function parseEnvelopeId(id: TEnvelopeId) {
  return {
    type: id.split('#')[0] as TEnvelopeType,
    id: id.split('#')[1],
  }
}
export function getEnvelopeId(type: TEnvelopeType, id: string) {
  return `${type}#${id}` as TEnvelopeId
}
