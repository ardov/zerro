import { AppThunk } from 'store'
import { executeReduxCommand } from 'core-next/adapters/redux/executeCommand'
import {
  compileDeleteReminder,
  compileSetReminder,
} from 'core-next/zenmoney/reminders'
import {
  Modify,
  OptionalExceptFor,
  TDateDraft,
  TReminderId,
} from '6-shared/types'
import { TReminder } from '6-shared/types'

type ReminderPatch = OptionalExceptFor<TReminder, 'id'>

type ReminderDraft = Modify<
  OptionalExceptFor<TReminder, 'incomeAccount' | 'outcomeAccount'>,
  { startDate?: TDateDraft; endDate?: TDateDraft }
>

export const setReminder =
  (
    draft: ReminderDraft | ReminderPatch | Array<ReminderDraft | ReminderPatch>
  ): AppThunk<TReminder[]> =>
  dispatch =>
    dispatch(
      executeReduxCommand(
        { type: 'zenmoney.reminder.set', payload: draft } as const,
        (state, ctx) => {
          const patch = compileSetReminder(state.data.current, draft, ctx)
          return { patch, receipt: patch.reminder || [] }
        }
      )
    ) as TReminder[]

export const deleteReminder =
  (id: TReminderId): AppThunk =>
  dispatch =>
    dispatch(
      executeReduxCommand(
        { type: 'zenmoney.reminder.delete', payload: { id } } as const,
        (state, ctx) => compileDeleteReminder(state.data.current, id, ctx)
      )
    )
