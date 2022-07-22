import { createSelector } from '@reduxjs/toolkit'
import { getReminders, setReminder } from 'models/reminder'
import { getRootUser } from 'models/user'
import { isISOMonth } from 'shared/helpers/date'
import { keys } from 'shared/helpers/keys'
import { IReminder, TISOMonth } from 'shared/types'
import { AppThunk, TSelector } from 'store'
import { prepareDataAccount } from './dataAccount'
import { parseComment } from './helpers'
import { RecordType } from './types'

type TMonthlyStore<TPayload> = {
  type: RecordType
  getDataReminders: TSelector<Record<TISOMonth, IReminder>>
  getData: TSelector<Record<TISOMonth, TPayload>>
  setData: (payload: TPayload, month: TISOMonth) => AppThunk<void>
}

export function makeMonthlyHiddenStore<TPayload>(
  type: RecordType
): TMonthlyStore<TPayload> {
  const getDataReminders: TSelector<Record<TISOMonth, IReminder>> =
    createSelector([getReminders], reminders => {
      const result: Record<TISOMonth, IReminder> = {}
      Object.values(reminders).forEach(r => {
        const data = parseComment(r.comment)
        if (data && data.type === type && isISOMonth(data.month)) {
          result[data.month] = r
        }
      })
      return result
    })
  const getData: TSelector<Record<TISOMonth, TPayload>> = createSelector(
    [getDataReminders],
    reminders => {
      const result: Record<TISOMonth, TPayload> = {}
      keys(reminders).forEach(month => {
        const reminder = reminders[month]
        result[month] = parseComment(reminder.comment)?.payload as TPayload
      })
      return result
    }
  )
  const setData =
    (payload: TPayload, month: TISOMonth): AppThunk<IReminder> =>
    (dispatch, getState) => {
      if (!isISOMonth(month)) {
        throw new Error('Invalid month')
      }
      const state = getState()
      const dataAccId = dispatch(prepareDataAccount())
      const existingReminder = getDataReminders(state)[month]
      const user = getRootUser(state)?.id
      if (!user) {
        throw new Error('No user')
      }

      return dispatch(
        setReminder({
          id: existingReminder?.id,
          incomeAccount: dataAccId,
          outcomeAccount: dataAccId,
          income: 1,
          startDate: '2020-01-01',
          endDate: '2020-01-01',
          comment: JSON.stringify({ type, month, payload }),
        })
      )[0]
    }

  return {
    type,
    getDataReminders,
    getData,
    setData,
  }
}
