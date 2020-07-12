import { createSelector } from 'redux-starter-kit'
import { getReminders } from 'store/localData/reminders'
import { ACC_LINKS, TAG_ORDER, GOALS } from './constants'
import { getAccountList } from 'store/localData/accounts'
import { DATA_ACC_NAME } from './constants'

// DATA ACCOUNT SELECTOR
export function getDataAccountId(state) {
  const dataAcc = getAccountList(state).find(acc => acc.title === DATA_ACC_NAME)
  return dataAcc ? dataAcc.id : null
}

// Get all data-reminders
export const getDataReminders = createSelector([getReminders], reminders => {
  const array = Object.values(reminders)
  return {
    [ACC_LINKS]: array.find(reminder => reminder.payee === ACC_LINKS),
    [TAG_ORDER]: array.find(reminder => reminder.payee === TAG_ORDER),
    [GOALS]: array.find(reminder => reminder.payee === GOALS),
  }
})

// Get concreet reminders
const getAccLinksReminder = createSelector(
  [getDataReminders],
  reminders => reminders[ACC_LINKS]
)
const getGoalsReminder = createSelector(
  [getDataReminders],
  reminders => reminders[GOALS]
)
const getTagOrderReminder = createSelector(
  [getDataReminders],
  reminders => reminders[TAG_ORDER]
)

// Get raw data from reminders
export const getRawAccLinks = createSelector([getAccLinksReminder], reminder =>
  parseDataFromReminder(reminder)
)
export const getRawGoals = createSelector([getGoalsReminder], reminder =>
  parseDataFromReminder(reminder)
)
export const getRawTagOrder = createSelector([getTagOrderReminder], reminder =>
  parseDataFromReminder(reminder)
)

function parseDataFromReminder(reminder) {
  try {
    return JSON.parse(reminder.comment)
  } catch (error) {
    return null
  }
}
