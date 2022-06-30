import { AppThunk } from 'models'
import { setReminder, TReminder } from 'models/reminder'
import { getRootUser } from 'models/user'
import { prepareDataAccount } from './dataAccount'
import { getRecordId } from './helpers'
import { getDataReminders } from './parseReminders'
import { TRecord } from './types'

export function setHiddenDataPiece(record: TRecord): AppThunk<TReminder> {
  return (dispatch, getState) => {
    const dataAccId = dispatch(prepareDataAccount())

    const state = getState()
    const user = getRootUser(state)?.id
    if (!user) {
      throw new Error('No user')
    }
    const reminders = getDataReminders(state)
    const recordId = getRecordId(record)

    return dispatch(
      setReminder({
        id: reminders[recordId]?.id,
        incomeAccount: dataAccId,
        outcomeAccount: dataAccId,
        income: 1,
        startDate: '2020-01-01',
        endDate: '2020-01-01',
        comment: JSON.stringify(record),
      })
    )[0]
  }
}
