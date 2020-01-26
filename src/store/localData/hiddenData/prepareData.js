import { getRootUser } from 'store/serverData'
import { setAccount } from 'store/localData/accounts'
import { setReminder } from 'store/localData/reminders'
import { getGoals as getOldGoals } from 'store/localData/budgets'
import sendEvent from 'helpers/sendEvent'
import { ACC_LINKS, GOALS } from './constants'
import { makeDataAcc, makeDataReminder } from './helpers'
import {
  getDataAccountId,
  getOldAccLinksReminder,
  getGoalsReminder,
} from './index'

export const prepareData = () => (dispatch, getState) => {
  let state = getState()
  const user = getRootUser(state).id
  // If no data account create one
  let dataAccId = getDataAccountId(state)
  if (!dataAccId) {
    const acc = makeDataAcc(user)
    dispatch(setAccount(acc))
    dataAccId = acc.id
  }
  // Upgrade from previous data scheme
  dispatch(convertAccReminder())
  dispatch(convertGoals(dataAccId))
}

const convertAccReminder = () => (dispatch, getState) => {
  const state = getState()
  const oldReminder = getOldAccLinksReminder(state)
  if (oldReminder) {
    sendEvent('Upgrade: convertAccReminder')
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

const convertGoals = dataAccId => (dispatch, getState) => {
  const state = getState()
  const oldGoals = getOldGoals(state)
  const user = getRootUser(state).id
  const goalsReminder = getGoalsReminder(state)
  if (!goalsReminder && Object.values(oldGoals).length) {
    sendEvent('Upgrade: convertGoals')
    const dataReminder = makeDataReminder(user, dataAccId, GOALS, oldGoals)
    dispatch(setReminder(dataReminder))
  }
}
