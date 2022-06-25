import { getRootUser } from 'models/users'
import { getAccounts } from './index'
import { AppThunk } from 'models'
import { sendEvent } from 'shared/helpers/tracking'
import { getDataAccountId } from '../hiddenData/selectors'
import { makeDataAcc } from '../hiddenData/helpers'
import { TAccountId } from 'shared/types'
import { applyClientPatch } from 'models/data'

const createDataAcc = (): AppThunk => (dispatch, getState) => {
  sendEvent(`Accounts: Create data accaunt`)
  const state = getState()
  const user = getRootUser(state)
  if (!user) return
  const acc = makeDataAcc(user.id)
  dispatch(applyClientPatch({ account: [acc] }))
}

export const checkDataAcc = (): AppThunk => (dispatch, getState) => {
  const state = getState()
  if (!getDataAccountId(state)) {
    dispatch(createDataAcc())
  }
}

export const setInBudget =
  (id: TAccountId, inBalance: boolean): AppThunk =>
  (dispatch, getState) => {
    sendEvent(`Accounts: Set in budget`)
    const state = getState()
    const account = getAccounts(state)[id]
    if (!account) {
      console.warn('No account found')
      return
    }
    const newAcc = { ...account, inBalance: !!inBalance, changed: Date.now() }
    dispatch(applyClientPatch({ account: [newAcc] }))
  }
