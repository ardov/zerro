import { AppThunk } from 'models'
import { applyClientPatch } from 'models/data'
import { getRootUser } from 'models/user'
import { toISODate } from 'shared/helpers/date'
import { Modify, OptionalExceptFor, TDateDraft } from 'shared/types'
// import { makeReminder } from './makeReminder'
import { getReminders } from './model'
import { TReminder } from './types'

type ReminderPatch = OptionalExceptFor<TReminder, 'id'>

type ReminderDraft = Modify<
  OptionalExceptFor<TReminder, 'incomeAccount' | 'outcomeAccount'>,
  { startDate?: TDateDraft; endDate?: TDateDraft }
>
// type ReminderDraft = Modify<
// Partial<TReminder>,
//   OptionalExceptFor<TReminder, 'incomeAccount' | 'outcomeAccount'>,
//   { startDate?: TDateDraft; endDate?: TDateDraft }
// >

export const setReminder =
  (draft: ReminderDraft | ReminderPatch): AppThunk =>
  (dispatch, getState) => {
    const state = getState()

    // Patch existing reminder
    if (draft.id) {
      const reminder = getReminders(state)[draft.id]
      if (reminder) {
        const patched = {
          ...reminder,
          ...draft,
          startDate: draft.startDate
            ? toISODate(draft.startDate)
            : reminder.startDate,
          endDate: draft.endDate ? toISODate(draft.endDate) : reminder.endDate,
          changed: draft.changed || Date.now(),
        }
        dispatch(applyClientPatch({ reminder: [patched] }))
        return
      }
    }

    // Create new reminder
    const user = getRootUser(state)
    if (!user) return
    // const reminder = makeReminder({
    //   user: user.id,
    //   ...draft,
    // })
  }
