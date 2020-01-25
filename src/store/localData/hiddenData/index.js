import { createSelector } from 'redux-starter-kit'
import { getRootUser } from 'store/serverData'
import { setAccount, getAccountList } from 'store/localData/accounts'
import { makeAccount } from 'store/localData/accounts/helpers'
import { setReminder, getReminders } from 'store/localData/reminders'
import { makeReminder } from 'store/localData/reminders/helpers'
import sendEvent from 'helpers/sendEvent'

const DATA_ACC_NAME = '🤖 [Zerro Data]'
const GOALS = 'goals'
const ACC_LINKS = 'accLinks'

const setData = (type, data) => (dispatch, getState) => {
  // Upgrade from previous data scheme
  dispatch(updateReminderTypes())

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
  const dataReminders = {
    [ACC_LINKS]:
      getAccLinksReminder(state) || makeDataReminder(user, dataAcc, ACC_LINKS),
    [GOALS]: getGoalsReminder(state) || makeDataReminder(user, dataAcc, GOALS),
  }

  const reminder = dataReminders[type]

  const newReminder = {
    ...reminder,
    comment: JSON.stringify(data),
    changed: Date.now(),
  }
  dispatch(setReminder(newReminder))
}

const updateReminderTypes = () => (dispatch, getState) => {
  const state = getState()
  const oldReminder = getOldAccLinksReminder(state)
  if (oldReminder) {
    sendEvent('Upgrade: updateReminderTypes')
    const oldData = JSON.parse(oldReminder.comment) || {}
    const newReminder = {
      ...oldReminder,
      payee: ACC_LINKS,
      changed: Date.now(),
      comment: JSON.stringify(oldData.accTagMap),
    }
    dispatch(setReminder(newReminder))
  }
}

export const addConnection = (account, tag) => (dispatch, getState) => {
  const state = getState()
  const accTagMap = getAccTagMap(state)
  const newLinks = { ...accTagMap }
  if (tag) {
    sendEvent('Connection: Add')
    newLinks[account] = tag
  } else {
    sendEvent('Connection: Remove')
    delete newLinks[account]
  }
  dispatch(setData(ACC_LINKS, newLinks))
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
function makeDataReminder(user, account, type = DATA_ACC_NAME, data = '') {
  return makeReminder({
    user,
    incomeAccount: account,
    outcomeAccount: account,
    income: 1,
    startDate: +new Date(2020, 0, 1),
    endDate: +new Date(2020, 0, 1),
    payee: type,
    comment: JSON.stringify(data),
  })
}

// SELECTORS
function getDataAccountId(state) {
  const dataAcc = getAccountList(state).find(acc => acc.title === DATA_ACC_NAME)
  return dataAcc ? dataAcc.id : null
}
const getOldAccLinksReminder = createSelector([getReminders], reminders =>
  Object.values(reminders).find(reminder => reminder.payee === DATA_ACC_NAME)
)
const getAccLinksReminder = createSelector([getReminders], reminders =>
  Object.values(reminders).find(reminder => reminder.payee === ACC_LINKS)
)
const getGoalsReminder = createSelector([getReminders], reminders =>
  Object.values(reminders).find(reminder => reminder.payee === GOALS)
)

export const getAccTagMap = createSelector(
  [getOldAccLinksReminder, getAccLinksReminder],
  (oldReminder, newReminder) => {
    if (oldReminder) {
      const data = oldReminder.comment ? JSON.parse(oldReminder.comment) : {}
      return data.accTagMap || {}
    }
    if (newReminder) {
      return JSON.parse(newReminder.comment) || {}
    }
    return {}
  }
)
