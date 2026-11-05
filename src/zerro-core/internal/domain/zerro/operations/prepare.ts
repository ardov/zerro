import type { TCompiled, TCoreContext } from '../../../../types'
import type { TDataStore } from '../../zenmoney/model/store'
import { getZerroDataAccountId } from '../accounts/read'
import {
  HiddenDataType,
  getMonthlyHiddenDataReminders,
  getSimpleHiddenDataReminder,
} from '../hidden-data'
import { parseZerroOperation, type TZerroIntent } from './types'

export function documentFor(intent: TZerroIntent) {
  const type =
    intent.type === 'budgets.set'
      ? HiddenDataType.Budgets
      : intent.type.startsWith('goals.')
        ? HiddenDataType.Goals
        : intent.type === 'envelopes.patchMeta'
          ? HiddenDataType.EnvelopeMeta
          : intent.type === 'settings.patch'
            ? HiddenDataType.UserSettings
            : HiddenDataType.FxRates
  return { type, month: 'month' in intent ? intent.month : undefined }
}
export function findDocument(data: TDataStore, intent: TZerroIntent) {
  const { type, month } = documentFor(intent)
  return month
    ? getMonthlyHiddenDataReminders(data.reminder, type)[month]
    : getSimpleHiddenDataReminder(data.reminder, type)
}
export function prepareZerro(
  data: TDataStore,
  intents: TZerroIntent[],
  ctx: TCoreContext
): TCompiled {
  if (!intents.length) return { operations: [] }
  const accountId = getZerroDataAccountId(data.account) ?? ctx.uuid()
  const ids = new Map<string, string>()
  return {
    operations: intents.map(intent => {
      const doc = documentFor(intent)
      const key = `${doc.type}:${doc.month ?? ''}`
      const reminderId =
        ids.get(key) ?? findDocument(data, intent)?.id ?? ctx.uuid()
      ids.set(key, reminderId)
      return parseZerroOperation({
        ...intent,
        storage: { accountId, reminderId },
      })
    }),
  }
}
