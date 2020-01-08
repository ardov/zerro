import { getRootUser } from 'store/serverData'
import { setAccount, getDataAccountId } from './index'
import { makeDataAcc } from './helpers'
import sendEvent from 'helpers/sendEvent'

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
