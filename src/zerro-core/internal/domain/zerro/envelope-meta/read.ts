import type { ById } from '../../foundation/types'
import type { TReminder } from '../../zenmoney/entities/reminders'
import { getSimpleHiddenData, HiddenDataType } from '../hidden-data'
import type { TEnvelopeMeta } from './types'

export function getEnvelopeMeta(
  reminders: ById<TReminder>
): ById<TEnvelopeMeta> {
  return getSimpleHiddenData<ById<TEnvelopeMeta>>(
    reminders,
    HiddenDataType.EnvelopeMeta,
    {}
  )
}
