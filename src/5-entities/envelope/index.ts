import { core } from 'zerro-core/redux'

export type { TEnvelopeId } from './shared/envelopeId'
export type TEnvelope = core.envelopes.TPresentedEnvelope

export const envelopeVisibility = core.envelopes.envelopeVisibility
export type envelopeVisibility = core.envelopes.envelopeVisibility
export { EnvType, envId } from './shared/envelopeId'
