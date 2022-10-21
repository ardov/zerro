import { createSelector } from '@reduxjs/toolkit'
import { deleteReminder, getReminders, setReminder } from '@entities/reminder'
import { getRootUser } from '@entities/user'
import { isISOMonth } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { TReminder, TISOMonth } from '@shared/types'
import { AppThunk, TSelector } from '@store'
import { prepareDataAccount } from './dataAccount'
import { parseComment } from './helpers'
import { HiddenDataType } from './types'
import { shallowEqual } from 'react-redux'

type TMonthlyStore<TPayload> = {
  type: HiddenDataType
  getDataReminders: TSelector<Record<TISOMonth, TReminder>>
  getData: TSelector<Record<TISOMonth, TPayload>>
  setData: (payload: TPayload, month: TISOMonth) => AppThunk<void>
  resetMonth: (month: TISOMonth) => AppThunk<void>
}

export function makeMonthlyHiddenStore<TPayload>(
  type: HiddenDataType
): TMonthlyStore<TPayload> {
  const getDataReminders: TSelector<Record<TISOMonth, TReminder>> =
    createSelector(
      [getReminders],
      reminders => {
        const result: Record<TISOMonth, TReminder> = {}
        Object.values(reminders).forEach(r => {
          const data = parseComment(r.comment)
          if (data && data.type === type && isISOMonth(data.month)) {
            result[data.month] = r
          }
        })
        return result
      },
      { memoizeOptions: { resultEqualityCheck: shallowEqual } }
    )
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
    (payload: TPayload, month: TISOMonth): AppThunk<TReminder> =>
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

  const resetMonth =
    (month: TISOMonth): AppThunk =>
    (dispatch, getState) => {
      const id = getDataReminders(getState())[month]?.id
      if (id) dispatch(deleteReminder(id))
    }

  return {
    type,
    getDataReminders,
    getData,
    setData,
    resetMonth,
  }
}
