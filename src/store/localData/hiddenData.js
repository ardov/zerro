import { createSelector } from 'redux-starter-kit'
import { getRootUser } from 'store/serverData'
import { setAccount, getAccountList } from 'store/localData/accounts'
import { makeAccount } from 'store/localData/accounts/helpers'
import { setReminder, getReminders } from 'store/localData/reminders'
import { makeReminder } from 'store/localData/reminders/helpers'
import sendEvent from 'helpers/sendEvent'

const DATA_ACC_NAME = '🤖 [Zerro Data]'

export const createDataAcc = () => (dispatch, getState) => {
  sendEvent(`Accounts: Create data account`)
  const state = getState()
  const user = getRootUser(state).id
  const acc = makeDataAcc(user)
  dispatch(setAccount(acc))
}

export const checkDataAcc = () => (dispatch, getState) => {
  const state = getState()
  if (!getDataAccountId(state)) {
    console.log('no data acc. Create!')
    dispatch(createDataAcc())
  }
}

export const setData = data => (dispatch, getState) => {
  const state = getState()
  const user = getRootUser(state).id
  let dataAcc = getDataAccountId(state)

  if (!dataAcc) {
    console.log('no data acc. Create!')
    const acc = makeDataAcc(user)
    dispatch(setAccount(acc))
    dataAcc = acc.id
  }

  let dataReminder = getDataReminder(state)

  if (!dataReminder) {
    console.log('no data reminder. Create!')
    const reminder = makeDataReminder(user, dataAcc)
    dispatch(setReminder(reminder))
    dataReminder = reminder
  }

  const newReminder = {
    ...dataReminder,
    comment: JSON.stringify(data),
  }
  dispatch(setReminder(newReminder))
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

const getData = createSelector([getDataReminder], reminder =>
  reminder ? JSON.parse(reminder.comment) : null
)
