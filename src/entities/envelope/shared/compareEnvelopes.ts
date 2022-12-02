import { DataEntity } from '@shared/types'
import { envId } from './envelopeId'
import { TEnvelope } from './makeEnvelope'

export function compareEnvelopes(a: TEnvelope, b: TEnvelope) {
  // Sort by index if it's present
  if (a.indexRaw !== undefined && b.indexRaw !== undefined)
    return a.indexRaw - b.indexRaw
  if (a.indexRaw !== undefined) return -1
  if (b.indexRaw !== undefined) return 1

  // Sort by type
  if (a.type !== b.type) {
    const typeOrder = [
      DataEntity.Tag,
      DataEntity.Account,
      DataEntity.Merchant,
      'payee',
    ]
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
  }

  // Null category should be the first one
  const nullTagId = envId.get(DataEntity.Tag, null)
  if (a.id === nullTagId) return -1
  if (b.id === nullTagId) return 1

  // Finally sort by name
  return a.name.localeCompare(b.name)
}
