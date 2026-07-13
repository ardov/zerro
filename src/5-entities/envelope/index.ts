import type { envelopes as CoreEnvelopes } from 'zerro-core/redux'

export type { TEnvNode, TGroupNode } from './shared/structure'
export type { TEnvelopeId } from './shared/envelopeId'
export type TEnvelope = CoreEnvelopes.TPresentedEnvelope

export { envelopeVisibility } from './shared/metaData'
export { EnvType, envId } from './shared/envelopeId'
export { flattenStructure } from './shared/structure'
