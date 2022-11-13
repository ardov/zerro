import { TEnvelopeId, TEnvelopeType } from '@shared/types'

/** Encode and decode envelope ids */
export const envId = {
  /** Combines entity type and its id into envelope id */
  get: (type: TEnvelopeType, id: string | null) => {
    return `${type}#${id}` as TEnvelopeId
  },
  /** Splits envelope id into its type and entity id */
  parse: (id: TEnvelopeId) => {
    return {
      type: id.split('#')[0] as TEnvelopeType,
      id: id.split('#')[1],
    }
  },
}
