export {
  getEnvelopes,
  getEnvelopeStructure,
  getKeepingEnvelopes,
} from './getEnvelopes'

export type { TEnvNode, TGroupNode } from './shared/structure'
export type { TEnvelopeId } from './shared/envelopeId'
export type { TEnvelope } from './shared/makeEnvelope'

export { envelopeVisibility } from './shared/metaData'
export { EnvType, envId } from './shared/envelopeId'
export { flattenStructure } from './shared/structure'
