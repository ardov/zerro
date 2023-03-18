import { useAppSelector } from '@store/index'
import { applyStructure } from './applyStructure'
import {
  getEnvelopes,
  getEnvelopeStructure,
  getKeepingEnvelopes,
} from './getEnvelopes'
import { patchEnvelope } from './patchEnvelope'
import { envId } from './shared/envelopeId'
import { flattenStructure } from './shared/structure'

export type { TEnvNode, TGroupNode } from './shared/structure'
export type { TEnvelopeDraft } from './patchEnvelope'
export type { TEnvelopeId } from './shared/envelopeId'
export type { TEnvelope } from './shared/makeEnvelope'

export { envelopeVisibility } from './shared/metaData'
export { EnvType } from './shared/envelopeId'

export const envelopeModel = {
  // Selectors
  getEnvelopes,
  getEnvelopeStructure,
  getKeepingEnvelopes,

  // Hooks
  useEnvelopes: () => useAppSelector(getEnvelopes),
  useEnvelopeStructure: () => useAppSelector(getEnvelopeStructure),

  // Thunk
  patchEnvelope,
  applyStructure,

  // Helpers
  parseId: envId.parse,
  makeId: envId.get,
  flattenStructure,
}
