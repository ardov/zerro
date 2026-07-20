import type { TDataStore } from '../../zenmoney/store'
import type { TCoreContext, TIntentPatch } from '../../../types'
import { compileSetSimpleHiddenData, HiddenDataType } from '../hidden-data'
import { getEnvelopeMeta } from './read'
import type { TEnvelopeMetaPatch } from './types'

export function compilePatchEnvelopeMeta(
  data: TDataStore,
  updates: TEnvelopeMetaPatch | TEnvelopeMetaPatch[],
  ctx: TCoreContext
): TIntentPatch {
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
