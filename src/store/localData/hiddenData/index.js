import { createSelector } from 'redux-starter-kit'
import { getRootUser } from 'store/serverData'
import { getAccountList } from 'store/localData/accounts'
import { setReminder, getReminders } from 'store/localData/reminders'
import { getGoals as getOldGoals } from 'store/localData/budgets'
import sendEvent from 'helpers/sendEvent'
import { ACC_LINKS, GOALS, DATA_ACC_NAME } from './constants'
import { makeDataReminder } from './helpers'
import { prepareData } from './prepareData'

const setData = (type, data) => (dispatch, getState) => {
  dispatch(prepareData())
  const state = getState()
  const user = getRootUser(state).id
  const dataAcc = getDataAccountId(state)
  const dataReminders = {
    [ACC_LINKS]:
      getAccLinksReminder(state) || makeDataReminder(user, dataAcc, ACC_LINKS),
    [GOALS]: getGoalsReminder(state) || makeDataReminder(user, dataAcc, GOALS),
  }
  dispatch(
    setReminder({
      ...dataReminders[type],
      comment: JSON.stringify(data),
      changed: Date.now(),
    })
  )
}

// ACCOUNT LINK THUNK
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

// GOAL THUNKS
export const setGoal = ({ type, amount, start, end, tag }) => (
  dispatch,
  getState
) => {
  if (!amount) {
    dispatch(deleteGoal(tag))
    return
  }
  sendEvent(`Goals: set ${type} goal`)
  const goals = getGoals(getState())
  const newGoal = { type, amount, start, end }
  dispatch(setData(GOALS, { ...goals, [tag]: newGoal }))
}
export const deleteGoal = tag => (dispatch, getState) => {
  sendEvent(`Goals: delete goal`)
  const goals = getGoals(getState())
  const newGoals = { ...goals }
  delete newGoals[tag]
  dispatch(setData(GOALS, newGoals))
}

// DATA ACCOUNT SELECTOR
export function getDataAccountId(state) {
  const dataAcc = getAccountList(state).find(acc => acc.title === DATA_ACC_NAME)
  return dataAcc ? dataAcc.id : null
}

// REMINDER SELECTORS
export const getOldAccLinksReminder = createSelector(
  [getReminders],
  reminders =>
    Object.values(reminders).find(reminder => reminder.payee === DATA_ACC_NAME)
)
const getAccLinksReminder = createSelector([getReminders], reminders =>
  Object.values(reminders).find(reminder => reminder.payee === ACC_LINKS)
)
export const getGoalsReminder = createSelector([getReminders], reminders =>
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

export const getGoals = createSelector(
  [getOldGoals, getGoalsReminder],
  (oldGoals, goalsReminder) => {
    if (goalsReminder) return JSON.parse(goalsReminder.comment) || {}
    if (Object.values(oldGoals).length) return oldGoals
    return {}
  }
)
