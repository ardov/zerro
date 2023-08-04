import { envId, EnvType } from './envelopeId'
import { TEnvelope } from './makeEnvelope'

const nullTagId = envId.get(EnvType.Tag, null)

export function compareEnvelopes(a: TEnvelope, b: TEnvelope) {
  // Sort by index if it's present
  if (a.indexRaw !== undefined && b.indexRaw !== undefined)
    return a.indexRaw - b.indexRaw
  if (a.indexRaw !== undefined) return -1
  if (b.indexRaw !== undefined) return 1

  // Sort by type
  if (a.type !== b.type) {
    const typeOrder = [
      EnvType.Tag,
      EnvType.Account,
      EnvType.Merchant,
      EnvType.Payee,
    ]
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  }

  // Null category should be the first one
  if (a.id === nullTagId) return -1
  if (b.id === nullTagId) return 1

  // Finally sort by name
  return a.name.localeCompare(b.name)
}
