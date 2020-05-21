import { createSelector } from 'redux-starter-kit'
import { getRootUser } from 'store/serverData'
import { getAccountList } from 'store/localData/accounts'
import { setReminder, getReminders } from 'store/localData/reminders'
import sendEvent from 'helpers/sendEvent'
import { ACC_LINKS, GOALS, DATA_ACC_NAME } from './constants'
import { makeDataReminder } from './helpers'
import { prepareData } from './prepareData'
import { makeGoal, parseGoal } from './goals'
import { getTags } from '../tags'

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
  const state = getState()
  const goals = getRawGoals(state)
  const tags = getTags(state)
  let newGoals = { ...goals }

  // remove goals for deleted tags
  for (const tagId in newGoals) {
    if (!tags[tagId]) delete newGoals[tagId]
  }

  if (!amount) {
    sendEvent(`Goals: delete goal`)
    delete newGoals[tag]
  } else {
    sendEvent(`Goals: set ${type} goal`)
    newGoals[tag] = makeGoal({ type, amount, start, end })
  }
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

const getRawGoals = createSelector([getGoalsReminder], goalsReminder => {
  if (!goalsReminder?.comment) return {}
  try {
    return JSON.parse(goalsReminder.comment) || {}
  } catch (error) {
    return {}
  }
})
export const getGoals = createSelector(
  [getRawGoals, getTags],
  (rawGoals, tags) => {
    let goals = {}
    for (const tag in rawGoals) {
      if (rawGoals[tag] && tags[tag]) goals[tag] = parseGoal(rawGoals[tag])
    }
    return goals
  }
)

export const getGoal = (state, id) => getGoals(state)[id]
