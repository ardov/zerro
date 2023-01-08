import { shallowEqual } from 'react-redux'
import { createSelector } from '@reduxjs/toolkit'
import { isISOMonth } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'
import { TReminder, TISOMonth, ByMonth } from '@shared/types'

import { AppThunk, TSelector } from '@store'
import { deleteReminder, getReminders, setReminder } from '@entities/reminder'
import { prepareDataAccount } from './dataAccount'
import { parseComment } from './helpers'
import { HiddenDataType } from './types'

type TMonthlyStore<TPayload> = {
  type: HiddenDataType
  getDataReminders: TSelector<ByMonth<TReminder>>
  getData: TSelector<ByMonth<TPayload>>
  setData: (payload: TPayload, month: TISOMonth) => AppThunk<void>
  resetMonth: (month: TISOMonth) => AppThunk<void>
}

export function makeMonthlyHiddenStore<TPayload>(
  type: HiddenDataType
): TMonthlyStore<TPayload> {
  const getDataReminders: TSelector<ByMonth<TReminder>> = createSelector(
    [getReminders],
    reminders => {
      const result: ByMonth<TReminder> = {}
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
  const getData: TSelector<ByMonth<TPayload>> = createSelector(
    [getDataReminders],
    reminders => {
      const result: ByMonth<TPayload> = {}
      keys(reminders).forEach(month => {
        const reminder = reminders[month]
        result[month] = parseComment(reminder.comment)?.payload as TPayload
      })
      return result
    }
  )

  const resetMonth =
    (month: TISOMonth): AppThunk =>
    (dispatch, getState) => {
      const id = getDataReminders(getState())[month]?.id
      if (id) dispatch(deleteReminder(id))
    }

  const setData =
    (payload: TPayload, month: TISOMonth): AppThunk<TReminder | void> =>
    (dispatch, getState) => {
      if (!isISOMonth(month)) throw new Error('Invalid month')

      // If payload is empty just delete the node
      const isPayloadEmpty =
        !payload ||
        (Array.isArray(payload) && payload.length === 0) ||
        (typeof payload === 'object' && keys(payload).length === 0)
      if (isPayloadEmpty) {
        console.log('reset', payload, month)

        return dispatch(resetMonth(month))
      }

      const state = getState()
      const dataAccId = dispatch(prepareDataAccount())
      const existingReminder = getDataReminders(state)[month]

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
    resetMonth,
  }
}
