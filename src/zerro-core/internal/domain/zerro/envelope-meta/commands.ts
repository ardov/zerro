import type { TDataStore } from '../../zenmoney/model/store'
import type { TCoreContext } from '../../../../types'
import { prepareZerro } from '../operations/prepare'
import type { TZerroInput } from '../operations/types'
import type { TEnvelopeMetaPatch } from './types'
export function compilePatchEnvelopeMeta(
  data: TDataStore,
  updates: TEnvelopeMetaPatch | TEnvelopeMetaPatch[],
  ctx: TCoreContext
) {
  return prepareZerro(
    data,
    (Array.isArray(updates) ? updates : [updates]).map(({ id, ...fields }) => ({
      type: 'envelopes.patchMeta',
      envelopeId: id,
      set: Object.fromEntries(
        Object.entries(fields).filter(([, value]) => value !== undefined)
      ),
      unset: Object.keys(fields).filter(
        key => fields[key as keyof typeof fields] === undefined
      ) as TZerroInput<'envelopes.patchMeta'>['unset'],
    })),
    ctx
  )
}
