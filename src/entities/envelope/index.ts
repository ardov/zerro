import { useAppSelector } from '@store/index'
import {
  getEnvelopes,
  getEnvelopeStructure,
  getKeepingEnvelopes,
} from './getEnvelopes'
import { patchEnvelope } from './patchEnvelope'
import { envId } from './shared/envelopeId'
import { flattenStructure } from './shared/structure'

export type { TEnvTreeNode, TGroupTreeNode } from './shared/structure'
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

  // Helpers
  parseId: envId.parse,
  makeId: envId.get,
  flattenStructure,
}
