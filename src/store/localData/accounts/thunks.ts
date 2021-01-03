import { getRootUser } from 'store/serverData'
import { setAccount, getAccounts } from './index'
import { AppThunk } from 'store'

import { sendEvent } from 'helpers/tracking'
import { getDataAccountId } from '../hiddenData/selectors'
import { makeDataAcc } from '../hiddenData/helpers'
import { AccountId } from 'types'

export const createDataAcc = (): AppThunk => (dispatch, getState) => {
  sendEvent(`Accounts: Create data accaunt`)
  const state = getState()
  const user = getRootUser(state)
  if (!user) return
  const acc = makeDataAcc(user.id)
  dispatch(setAccount(acc))
}

export const checkDataAcc = (): AppThunk => (dispatch, getState) => {
  const state = getState()
  if (!getDataAccountId(state)) {
    dispatch(createDataAcc())
  }
}

export const setInBudget = (id: AccountId, inBalance: boolean): AppThunk => (
  dispatch,
  getState
) => {
  sendEvent(`Accounts: Set in budget`)
  const state = getState()
  const account = getAccounts(state)[id]
  if (!account) {
    console.warn('No account found')
    return
  }
  const newAcc = { ...account, inBalance: !!inBalance, changed: Date.now() }
  dispatch(setAccount(newAcc))
}
