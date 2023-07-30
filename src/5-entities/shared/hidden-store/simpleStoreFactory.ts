import { createSelector } from '@reduxjs/toolkit'
import { deleteReminder, getReminders, setReminder } from '5-entities/reminder'
import { TReminder } from '6-shared/types'
import { AppThunk, TSelector } from 'store'
import { prepareDataAccount } from './dataAccount'
import { parseComment } from './helpers'
import { HiddenDataType } from './types'

type TSimpleStore<TPayload> = {
  type: HiddenDataType
  getDataReminder: TSelector<TReminder | null>
  getData: TSelector<TPayload>
  setData: (payload: TPayload) => AppThunk<void>
  resetData: () => AppThunk<void>
}

export function makeSimpleHiddenStore<TPayload>(
  type: HiddenDataType,
  defaultValue: TPayload
): TSimpleStore<TPayload> {
  const getDataReminder: TSelector<TReminder | null> = createSelector(
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
    (payload: TPayload): AppThunk<TReminder> =>
    (dispatch, getState) => {
      const state = getState()
      const dataAccId = dispatch(prepareDataAccount())
      const existingReminder = getDataReminder(state)
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

  const resetData = (): AppThunk => (dispatch, getState) => {
    const id = getDataReminder(getState())?.id
    if (id) dispatch(deleteReminder(id))
  }

  return {
    type,
    getDataReminder,
    getData,
    setData,
    resetData,
  }
}
