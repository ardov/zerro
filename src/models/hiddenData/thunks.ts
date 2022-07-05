import { getRootUser } from '../user'
import { makeDataAcc, makeDataReminder } from './helpers'
import { getDataReminders, getDataAccountId } from './selectors'
import { DataReminderType } from './constants'
import { AppThunk } from 'store'
import { applyClientPatch } from 'store/data'

const prepareData: AppThunk = (dispatch, getState) => {
  let state = getState()
  const user = getRootUser(state)?.id
  if (!user) return
  // If no data account create one
  let dataAccId = getDataAccountId(state)
  if (!dataAccId) {
    const acc = makeDataAcc(user)
    dispatch(applyClientPatch({ account: [acc] }))
    dataAccId = acc.id
  }
}

export const setHiddenData =
  (type: DataReminderType, data: any): AppThunk =>
  (dispatch, getState) => {
    dispatch(prepareData)
    const state = getState()
    const user = getRootUser(state)?.id
    if (!user) return
    const dataAcc = getDataAccountId(state) as string
    const reminder =
      getDataReminders(state)[type] || makeDataReminder(user, dataAcc, type)
    dispatch(
      applyClientPatch({
        reminder: [
          {
            ...reminder,
            comment: JSON.stringify(data),
            changed: Date.now(),
          },
        ],
      })
    )
  }
