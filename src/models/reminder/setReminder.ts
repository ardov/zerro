import { AppThunk } from 'models'
import { applyClientPatch } from 'models/data'
import { getRootUser } from 'models/user'
import { Modify, OptionalExceptFor, TDateDraft } from 'shared/types'
import { makeReminder } from './makeReminder'
import { getReminders } from './model'
import { TReminder } from 'shared/types'

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
