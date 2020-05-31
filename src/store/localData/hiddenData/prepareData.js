import { getRootUser } from 'store/serverData'
import { setAccount } from 'store/localData/accounts'
import { makeDataAcc } from './helpers'
import { getDataAccountId } from './index'

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
}
