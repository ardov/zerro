import { createSelector } from '@reduxjs/toolkit'
import { getReminders } from 'store/localData/reminders'
import { ACC_LINKS, TAG_ORDER, GOALS } from './constants'
import { getAccountList } from 'store/localData/accounts'
import { DATA_ACC_NAME } from './constants'
import { RootState } from 'store'
import { Reminder, TagId, ZmGoal } from 'types'

/**
 * Returns id of special account to store data
 */
export function getDataAccountId(state: RootState) {
  const dataAcc = getAccountList(state).find(acc => acc.title === DATA_ACC_NAME)
  return dataAcc ? dataAcc.id : null
}

/**
 * Returns all reminders with data by data type
 * - connections between account and tag
 * - order of tags
 * - goals associated with tags
 */
export const getDataReminders = createSelector([getReminders], reminders => {
  const array = Object.values(reminders)
  return {
    [ACC_LINKS]: array.find(reminder => reminder.payee === ACC_LINKS),
    [TAG_ORDER]: array.find(reminder => reminder.payee === TAG_ORDER),
    [GOALS]: array.find(reminder => reminder.payee === GOALS),
  }
})

export type AccLinks = { [accId: string]: TagId }
export type RawGoals = { [tagId: string]: ZmGoal }
const getHiddenData = createSelector([getDataReminders], reminders => ({
  [ACC_LINKS]: parseComment<AccLinks>(reminders[ACC_LINKS]),
  [TAG_ORDER]: parseComment<TagId[]>(reminders[TAG_ORDER]),
  [GOALS]: parseComment<RawGoals>(reminders[GOALS]),
}))

export const getAccLinks = createSelector([getHiddenData], d => d[ACC_LINKS])
export const getTagOrder = createSelector([getHiddenData], d => d[TAG_ORDER])
export const getRawGoals = createSelector([getHiddenData], d => d[GOALS])

/**
 * Parses comment in reminder and returns parsed JSON or null
 */
function parseComment<OutcomeType>(reminder?: Reminder): OutcomeType | null {
  if (!reminder?.comment) return null
  try {
    return JSON.parse(reminder.comment)
  } catch (error) {
    return null
  }
}
