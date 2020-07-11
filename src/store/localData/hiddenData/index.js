import { createSelector } from 'redux-starter-kit'
import { getRootUser } from 'store/serverData'
import { getAccountList } from 'store/localData/accounts'
import { setReminder, getReminders } from 'store/localData/reminders'
import sendEvent from 'helpers/sendEvent'
import { ACC_LINKS, TAG_ORDER, GOALS, DATA_ACC_NAME } from './constants'
import { makeDataReminder } from './helpers'
import { prepareData } from './prepareData'
import { makeGoal, parseGoal } from './goals'
import { getTags } from '../tags'

const setData = (type, data) => (dispatch, getState) => {
  dispatch(prepareData())
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
export const setGoal = ({ type, amount, end, tag }) => (dispatch, getState) => {
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
    newGoals[tag] = makeGoal({ type, amount, end })
  }
  dispatch(setData(GOALS, newGoals))
}

// DATA ACCOUNT SELECTOR
export function getDataAccountId(state) {
  const dataAcc = getAccountList(state).find(acc => acc.title === DATA_ACC_NAME)
  return dataAcc ? dataAcc.id : null
}

// REMINDER SELECTORS

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
const getRawAccLinks = createSelector([getAccLinksReminder], reminder =>
  parseDataFromReminder(reminder)
)
const getRawGoals = createSelector([getGoalsReminder], reminder =>
  parseDataFromReminder(reminder)
)
const getRawTagOrder = createSelector([getTagOrderReminder], reminder =>
  parseDataFromReminder(reminder)
)
function parseDataFromReminder(reminder) {
  try {
    return JSON.parse(reminder.comment)
  } catch (error) {
    return null
  }
}

// Account-Tag connections without broken links
export const getAccTagMap = createSelector(
  [getRawAccLinks, getTags],
  (links, tags) => {
    if (!links) return {}
    // ignore connections for deleted tags
    for (const accId in links) {
      const tagId = links[accId]
      if (!tags[tagId]) delete links[accId]
    }
    return links
  }
)

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
