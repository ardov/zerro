import type { OptionalExceptFor, TDataStore } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { compileSetSimpleHiddenData, HiddenDataType } from '../hidden-data'
import { getEnvelopeMeta, type TEnvelopeMeta } from './read'

export type TEnvelopeMetaPatch = OptionalExceptFor<TEnvelopeMeta, 'id'>

export function compilePatchEnvelopeMeta(
  data: TDataStore,
  updates: TEnvelopeMetaPatch | TEnvelopeMetaPatch[],
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TNormalizedPatch {
  const currentData = getEnvelopeMeta(data)
  const payload = { ...currentData }

  const list = Array.isArray(updates) ? updates : [updates]
  list.forEach(update => {
    payload[update.id] = { ...currentData[update.id], ...update }
  })

  return compileSetSimpleHiddenData(
    data,
    HiddenDataType.EnvelopeMeta,
    payload,
    ctx
  )
}
