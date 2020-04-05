import { getRootUser } from 'store/serverData'
import { setAccount, getAccounts } from './index'

import sendEvent from 'helpers/sendEvent'
import { getDataAccountId } from '../hiddenData'
import { makeDataAcc } from '../hiddenData/helpers'

export const createDataAcc = () => (dispatch, getState) => {
  sendEvent(`Accounts: Create data accaunt`)
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

export const setInBudget = (id, inBalance) => (dispatch, getState) => {
  sendEvent(`Accounts: Set in budget`)
  const state = getState()
  const account = getAccounts(state)[id]
  if (!account) {
    console.warn('No accoun found')
    return
  }
  const newAcc = { ...account, inBalance: !!inBalance, changed: Date.now() }
  dispatch(setAccount(newAcc))
}
