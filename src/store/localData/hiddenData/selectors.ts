import { createSelector } from '@reduxjs/toolkit'
import { getReminders } from 'store/localData/reminders'
import { ACC_LINKS, TAG_ORDER, GOALS } from './constants'
import { getAccountList } from 'store/localData/accounts'
import { DATA_ACC_NAME } from './constants'
import { RootState } from 'store'
import { Reminder, TagId, ZmGoal } from 'types'

// DATA ACCOUNT SELECTOR
export function getDataAccountId(state: RootState) {
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
export interface AccLinks {
  [accId: string]: TagId
}
export const getRawAccLinks = createSelector(
  [getAccLinksReminder],
  reminder => parseDataFromReminder(reminder) as AccLinks | null
)

export interface RawGoals {
  [tagId: string]: ZmGoal
}
export const getRawGoals = createSelector(
  [getGoalsReminder],
  reminder => parseDataFromReminder(reminder) as RawGoals | null
)

export const getRawTagOrder = createSelector(
  [getTagOrderReminder],
  reminder => parseDataFromReminder(reminder) as TagId[] | null
)

function parseDataFromReminder(reminder?: Reminder) {
  if (!reminder?.comment) return null
  try {
    return JSON.parse(reminder.comment)
  } catch (error) {
    return null
  }
}
