import { createSelector } from 'redux-starter-kit'
import { getRootUser } from 'store/serverData'
import { setAccount, getAccountList } from 'store/localData/accounts'
import { makeAccount } from 'store/localData/accounts/helpers'
import { setReminder, getReminders } from 'store/localData/reminders'
import { makeReminder } from 'store/localData/reminders/helpers'
import sendEvent from 'helpers/sendEvent'

const DATA_ACC_NAME = '🤖 [Zerro Data]'

const setData = data => (dispatch, getState) => {
  const state = getState()
  const user = getRootUser(state).id

  // Need account to create reminder
  let dataAcc = getDataAccountId(state)
  if (!dataAcc) {
    const acc = makeDataAcc(user)
    dispatch(setAccount(acc))
    dataAcc = acc.id
  }

  // All data stored in reminder.comment
  let dataReminder = getDataReminder(state)
  if (!dataReminder) {
    const reminder = makeDataReminder(user, dataAcc)
    dispatch(setReminder(reminder))
    dataReminder = reminder
  }

  const newReminder = {
    ...dataReminder,
    comment: JSON.stringify(data),
    changed: Date.now(),
  }
  dispatch(setReminder(newReminder))
}

export const setDataByKey = (key, keyData) => (dispatch, getState) => {
  const state = getState()
  const data = getHiddenData(state)
  dispatch(setData({ ...data, [key]: keyData }))
}

export const addConnection = (account, tag) => (dispatch, getState) => {
  sendEvent('Connection: Add')
  const state = getState()
  const accTagMap = getAccTagMap(state)
  dispatch(setDataByKey('accTagMap', { ...accTagMap, [account]: tag }))
}

// DATA ACCOUNT
function makeDataAcc(user) {
  return makeAccount({
    user,
    instrument: 2,
    title: DATA_ACC_NAME,
    archive: true,
  })
}

// DATA REMINDER
function makeDataReminder(user, account, data = '') {
  return makeReminder({
    user,
    incomeAccount: account,
    outcomeAccount: account,
    income: 1,
    startDate: +new Date(2020, 0, 1),
    endDate: +new Date(2020, 0, 1),
    payee: DATA_ACC_NAME,
    comment: JSON.stringify(data),
  })
}

// SELECTORS
function getDataAccountId(state) {
  const dataAcc = getAccountList(state).find(acc => acc.title === DATA_ACC_NAME)
  return dataAcc ? dataAcc.id : null
}

const getDataReminder = createSelector([getReminders], reminders =>
  Object.values(reminders).find(reminder => reminder.payee === DATA_ACC_NAME)
)

const getHiddenData = createSelector([getDataReminder], reminder =>
  reminder && reminder.comment ? JSON.parse(reminder.comment) : {}
)

export const getAccTagMap = createSelector(
  [getHiddenData],
  data => data.accTagMap || {}
)
