import type { core } from 'zerro-core/redux'

export type { TEnvelopeId } from './shared/envelopeId'
export type TEnvelope = core.envelopes.TPresentedEnvelope

export { envelopeVisibility } from './shared/metaData'
export { EnvType, envId } from './shared/envelopeId'
