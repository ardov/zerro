import { AppThunk } from 'models'
import { setReminder } from 'models/reminder'
import { getRootUser } from 'models/user'
import { TISODate } from 'shared/types'
import { getDataAccountId, prepareDataAccount } from './dataAccount'
import { getRecordId } from './helpers'
import { getDataReminders } from './parseReminders'
import { RecordType } from './types'

export const setHiddenData =
  (data: any, type: RecordType, date?: TISODate): AppThunk =>
  (dispatch, getState) => {
    dispatch(prepareDataAccount)

    const state = getState()
    const user = getRootUser(state)?.id
    if (!user) return
    const reminders = getDataReminders(state)
    const recordId = getRecordId(type, date)
    const updatedData = { type, date, data }
    const comment = JSON.stringify(updatedData)
    if (reminders[recordId]) {
      // Update existing reminder
      dispatch(
        setReminder({
          id: reminders[recordId].id,
          comment,
        })
      )
    } else {
      // Create new reminder
      const dataAcc = getDataAccountId(state)
      if (!dataAcc) return
      dispatch(
        setReminder({
          incomeAccount: dataAcc,
          outcomeAccount: dataAcc,
          income: 1,
          startDate: '2020-01-01',
          endDate: '2020-01-01',
          comment,
        })
      )
    }
  }
