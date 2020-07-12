import { getRootUser } from 'store/serverData'
import { setAccount } from 'store/localData/accounts'
import { makeDataAcc, makeDataReminder } from './helpers'
import { getDataReminders, getDataAccountId } from './selectors'
import { setReminder } from 'store/localData/reminders'

export const setHiddenData = (type, data) => (dispatch, getState) => {
  dispatch(prepareData)
  const state = getState()
  const user = getRootUser(state).id
  const dataAcc = getDataAccountId(state)
  const reminder =
    getDataReminders(state)[type] || makeDataReminder(user, dataAcc, type)
  dispatch(
    setReminder({
      ...reminder,
      comment: JSON.stringify(data),
      changed: Date.now(),
    })
  )
}

function prepareData(dispatch, getState) {
  let state = getState()
  const user = getRootUser(state).id

  // If no data account create one
  let dataAccId = getDataAccountId(state)
  if (!dataAccId) {
    const acc = makeDataAcc(user)
    dispatch(setAccount(acc))
    dataAccId = acc.id
  }
}
