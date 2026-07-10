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
  // Selectors. Reads are migrated to Core Next; these stay as the reference
  // implementation for parity tests and for the not-yet-migrated write thunks.
  /** @deprecated Read via `selectCoreEnvelopes` from `core-next/adapters/redux` */
  getEnvelopes,
  /** @deprecated Read via `selectCoreEnvelopeStructure` from `core-next/adapters/redux` */
  getEnvelopeStructure,
  /** @deprecated Read via `selectCoreKeepingEnvelopeIds` from `core-next/adapters/redux` */
  getKeepingEnvelopes,

  // Thunk
  patchEnvelope,

  // Helpers
  parseId: envId.parse,
  makeId: envId.get,
  flattenStructure,
}
