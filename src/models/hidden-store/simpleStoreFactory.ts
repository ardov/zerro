import { createSelector } from '@reduxjs/toolkit'
import { getReminders, setReminder } from 'models/reminder'
import { getRootUser } from 'models/user'
import { IReminder } from 'shared/types'
import { AppThunk, TSelector } from 'store'
import { prepareDataAccount } from './dataAccount'
import { parseComment } from './helpers'
import { HiddenDataType } from './types'

type TSimpleStore<TPayload> = {
  type: HiddenDataType
  getDataReminder: TSelector<IReminder | null>
  getData: TSelector<TPayload>
  setData: (payload: TPayload) => AppThunk<void>
}

export function makeSimpleHiddenStore<TPayload>(
  type: HiddenDataType,
  defaultValue: TPayload
): TSimpleStore<TPayload> {
  const getDataReminder: TSelector<IReminder | null> = createSelector(
    [getReminders],
    reminders => {
      return (
        Object.values(reminders).find(r => {
          const data = parseComment(r.comment)
          return data && data?.type === type
        }) || null
      )
    }
  )
  const getData: TSelector<TPayload> = createSelector(
    [getDataReminder],
    reminder => {
      if (!reminder) return defaultValue
      return parseComment(reminder.comment)?.payload as TPayload
    }
  )
  const setData =
    (payload: TPayload): AppThunk<IReminder> =>
    (dispatch, getState) => {
      const state = getState()
      const dataAccId = dispatch(prepareDataAccount())
      const existingReminder = getDataReminder(state)
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
          comment: JSON.stringify({ type, payload }),
        })
      )[0]
    }

  return {
    type,
    getDataReminder,
    getData,
    setData,
  }
}
