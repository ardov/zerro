import { toISODate } from '../../shared/date'
import type { Modify } from '../../shared/types'
import type { TDataStore } from '../store'
import {
  DataEntity,
  type TCoreContext,
  type TIntentPatch,
} from '../../../types'
import type { TDateDraft } from '../primitives'
import { getRootUserId } from '../users'
import { makeReminder, type TReminderFactoryDraft } from './factory'
import { getReminders } from './read'
import type { TReminderId, TReminderPatch } from './types'

export type TReminderDraft = Modify<
  Omit<TReminderFactoryDraft, 'user'>,
  { startDate?: TDateDraft; endDate?: TDateDraft }
>

export function compileSetReminder(
  data: TDataStore,
  draft:
    TReminderDraft | TReminderPatch | Array<TReminderDraft | TReminderPatch>,
  ctx: TCoreContext
): TIntentPatch {
  const list = Array.isArray(draft) ? draft : [draft]

  return {
    reminder: list.map(item => {
      // Update: pass the sparse patch through; issue keeps only changed fields.
      if (item.id && getReminders(data)[item.id]) {
        const {
          changed: _ignored,
          startDate,
          endDate,
          ...fields
        } = item as TReminderDraft
        const patch: TReminderPatch = { ...fields, id: item.id }
        if (startDate !== undefined) patch.startDate = toISODate(startDate)
        if (endDate !== undefined) patch.endDate = toISODate(endDate)
        return patch
      }

      // Creation: the factory captures generated ids and defaults at issue time.
      const user = getRootUserId(data)
      if (!user) throw new Error('User is not defined')
      if (!item.incomeAccount || !item.outcomeAccount) {
        throw new Error('Missing incomeAccount or outcomeAccount')
      }

      return makeReminder({ ...item, user } as TReminderFactoryDraft, ctx)
    }),
  }
}

export function compileDeleteReminder(
  data: TDataStore,
  id: TReminderId
): TIntentPatch {
  if (!getReminders(data)[id]) return {}

  return {
    deletion: [{ id, object: DataEntity.Reminder }],
  }
}
