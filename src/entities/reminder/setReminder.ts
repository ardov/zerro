import { AppThunk } from '@store'
import { applyClientPatch } from '@store/data'
import { getRootUser } from '@entities/user'
import {
  DataEntity,
  Modify,
  OptionalExceptFor,
  TDateDraft,
  TDeletionObject,
  TReminderId,
} from '@shared/types'
import { makeReminder } from './makeReminder'
import { getReminders } from './model'
import { TReminder } from '@shared/types'

type ReminderPatch = OptionalExceptFor<TReminder, 'id'>

type ReminderDraft = Modify<
  OptionalExceptFor<TReminder, 'incomeAccount' | 'outcomeAccount'>,
  { startDate?: TDateDraft; endDate?: TDateDraft }
>

export const setReminder =
  (
    draft: ReminderDraft | ReminderPatch | Array<ReminderDraft | ReminderPatch>
  ): AppThunk<TReminder[]> =>
  (dispatch, getState) => {
    const arr = Array.isArray(draft) ? draft : [draft]
    const state = getState()

    const readyReminders = arr.map(el => {
      const currentReminder = el.id && getReminders(state)[el.id]
      const patched = {
        ...(currentReminder || ({} as TReminder)),
        ...el,
        changed: el.changed || Date.now(),
      }
      if (!patched.user) {
        const userId = getRootUser(state)?.id
        if (!userId) {
          throw new Error('User is not defined')
        }
        patched.user = userId
      }
      if (!patched.incomeAccount || !patched.outcomeAccount) {
        throw new Error('Missing incomeAccount or outcomeAccount')
      }
      return makeReminder(patched)
    })
    dispatch(applyClientPatch({ reminder: readyReminders }))
    return readyReminders
  }

export const deleteReminder =
  (id: TReminderId): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const userId = getRootUser(state)?.id
    if (!userId) {
      throw new Error('User is not defined')
    }
    const currentReminder = getReminders(state)[id]
    if (currentReminder) {
      const del: TDeletionObject = {
        id,
        object: DataEntity.Reminder,
        stamp: Date.now(),
        user: userId,
      }
      dispatch(applyClientPatch({ deletion: [del] }))
    }
  }
