import { DataEntity } from '@shared/types'
import { getEnvelopeId } from './helpers'
import { TEnvelope } from './makeEnvelope'

export function compareEnvelopes(a: TEnvelope, b: TEnvelope) {
  // Sort by index if it's present (!== -1)
  if (a.index !== -1 && b.index !== -1) return a.index - b.index
  if (a.index !== -1) return -1
  if (b.index !== -1) return 1

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
  const nullTagId = getEnvelopeId(DataEntity.Tag, null)
  if (a.id === nullTagId) return -1
  if (b.id === nullTagId) return 1

  // Finally sort by name
  return a.name.localeCompare(b.name)
}