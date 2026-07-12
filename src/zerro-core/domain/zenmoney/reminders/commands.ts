import type { Modify, OptionalExceptFor } from '../../shared/types'
import type { TDataStore } from '../store'
import {
  DataEntity,
  type TCoreContext,
  type TNormalizedPatch,
} from '../../../types'
import type { TDateDraft } from '../primitives'
import { getRootUserId } from '../users'
import { makeReminder, type TReminderFactoryDraft } from './factory'
import { getReminders } from './read'
import type { TReminder, TReminderId } from './types'

export type TReminderPatch = OptionalExceptFor<TReminder, 'id'>
export type TReminderDraft = Modify<
  Omit<TReminderFactoryDraft, 'user'>,
  { startDate?: TDateDraft; endDate?: TDateDraft }
>

export function compileSetReminder(
  data: TDataStore,
  draft:
    | TReminderDraft
    | TReminderPatch
    | Array<TReminderDraft | TReminderPatch>,
  ctx: TCoreContext
): TNormalizedPatch {
  const list = Array.isArray(draft) ? draft : [draft]

  return {
    reminder: list.map(item => {
      const current = hasId(item) ? getReminders(data)[item.id] : undefined
      const patched = {
        ...(current || ({} as TReminder)),
        ...item,
        changed: item.changed || ctx.now(),
      } as TReminderFactoryDraft

      if (!patched.user) {
        const user = getRootUserId(data)
        if (!user) throw new Error('User is not defined')
        patched.user = user
      }
      if (!patched.incomeAccount || !patched.outcomeAccount) {
        throw new Error('Missing incomeAccount or outcomeAccount')
      }

      return makeReminder(patched, ctx)
    }),
  }
}

export function compileDeleteReminder(
  data: TDataStore,
  id: TReminderId,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const user = getRootUserId(data)
  if (!user) throw new Error('User is not defined')

  if (!getReminders(data)[id]) return {}

  return {
    deletion: [
      {
        id,
        object: DataEntity.Reminder,
        stamp: ctx.now(),
        user,
      },
    ],
  }
}

function hasId(
  reminder: TReminderDraft | TReminderPatch
): reminder is TReminderPatch {
  return !!reminder.id
}
