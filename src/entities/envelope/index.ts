import { useAppSelector } from '@store/index'
import { getEnvelopes, getEnvelopeStructure } from './getEnvelopes'
import { patchEnvelope } from './patchEnvelope'
import { envId } from './shared/envelopeId'
import { flattenStructure } from './shared/structure'

export type { TEnvTreeNode, TGroupTreeNode } from './shared/structure'
export type { TEnvelopeDraft } from './patchEnvelope'
export type { TEnvelope } from './shared/makeEnvelope'
export { envelopeVisibility } from './shared/metaData'

export const envelopeModel = {
  getEnvelopes,
  getEnvelopeStructure,
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
