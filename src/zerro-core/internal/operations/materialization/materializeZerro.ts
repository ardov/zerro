import type {
  TDataStore,
  TIntentPatch,
} from '../../domain/zenmoney/model/store'
import { compileSetTagBudget } from '../../domain/zenmoney/entities/budgets'
import { envId, EnvType } from '../../domain/zerro/envelope-id'
import { getZerroDataAccountId } from '../../domain/zerro/accounts/read'
import {
  compileSetMonthlyHiddenData,
  compileSetSimpleHiddenData,
  compileResetMonthlyHiddenData,
  parseHiddenDataComment,
  mergePatches,
} from '../../domain/zerro/hidden-data'
import {
  documentFor,
  findDocument,
} from '../../domain/zerro/operations/prepare'
import type { TZerroOperation } from '../../domain/zerro/operations/types'

/** Resolve domain intent using current storage; never infer intent from JSON. */
export function materializeZerro(
  data: TDataStore,
  operation: TZerroOperation,
  issuedAt: number
): TIntentPatch {
  const { type, month } = documentFor(operation)
  const reminder = findDocument(data, operation)
  const previous = reminder ? parseHiddenDataComment(reminder.comment) : null
  const payload = { ...((previous?.payload ?? {}) as Record<string, unknown>) }
  const dataAccount = getZerroDataAccountId(data.account)
  const ids = dataAccount
    ? [operation.storage.reminderId]
    : [operation.storage.accountId, operation.storage.reminderId]
  const ctx = {
    now: () => issuedAt,
    uuid: () => {
      const id = ids.shift()
      if (!id) throw new Error('Missing reserved storage ID')
      return id
    },
  }
  let native: TIntentPatch = {}
  switch (operation.type) {
    case 'budgets.set': {
      const tags = operation.values.filter(
        value =>
          operation.nativeTags &&
          envId.parse(value.envelopeId).type === EnvType.Tag
      )
      native = compileSetTagBudget(
        data,
        tags.map(value => ({
          month: operation.month,
          tag:
            envId.parse(value.envelopeId).id === 'null'
              ? null
              : envId.parse(value.envelopeId).id,
          value: value.amount,
        }))
      )
      for (const value of operation.values) {
        if (tags.includes(value)) continue
        if (value.amount === 0) delete payload[value.envelopeId]
        else payload[value.envelopeId] = value.amount
      }
      break
    }
    case 'goals.set':
      payload[operation.envelopeId] = operation.goal
      break
    case 'goals.stop':
      payload[operation.envelopeId] = null
      break
    case 'goals.clearOverride':
      delete payload[operation.envelopeId]
      break
    case 'envelopes.patchMeta': {
      const fields = patchFields(payload[operation.envelopeId], operation)
      if (!Object.keys(fields).length && !payload[operation.envelopeId])
        return {}
      payload[operation.envelopeId] = { ...fields, id: operation.envelopeId }
      break
    }
    case 'settings.patch':
      return write(patchFields(payload, operation))
    case 'fxRates.patch': {
      const rates = patchFields(payload.rates, operation)
      if (JSON.stringify(rates) === JSON.stringify(payload.rates ?? {}))
        return {}
      return write({ ...payload, rates, date: month, changed: issuedAt })
    }
    case 'fxRates.reset':
      return compileResetMonthlyHiddenData(data, type, month!)
  }
  return mergePatches(native, write(payload))

  function write(value: object): TIntentPatch {
    if (JSON.stringify(value) === JSON.stringify(previous?.payload ?? {}))
      return {}
    if (!reminder && data.reminder[operation.storage.reminderId])
      throw new Error('Reserved reminder ID is occupied')
    if (!dataAccount && data.account[operation.storage.accountId])
      throw new Error('Reserved account ID is occupied')
    const patch = month
      ? compileSetMonthlyHiddenData(data, type, value, month, ctx)
      : compileSetSimpleHiddenData(data, type, value, ctx)
    if (previous && patch.reminder)
      patch.reminder = patch.reminder.map(row => ({
        id: row.id,
        comment: JSON.stringify({ ...previous, payload: value }),
      }))
    return patch
  }
}
function patchFields(
  current: unknown,
  operation: { set?: object; unset?: string[] }
): Record<string, unknown> {
  const value = { ...((current ?? {}) as object), ...operation.set } as Record<
    string,
    unknown
  >
  for (const key of operation.unset ?? []) delete value[key]
  return value
}
