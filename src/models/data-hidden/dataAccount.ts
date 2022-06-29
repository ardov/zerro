import { createSelector } from '@reduxjs/toolkit'
import { AppThunk } from 'models'
import { getAccounts, makeAccount } from 'models/account'
import { applyClientPatch } from 'models/data'
import { getRootUser } from 'models/user'

export const DATA_ACC_NAME = '🤖 [Zerro Data]'

/**
 *  This is helper account which is used to store reminders with hidden data.
 *  We need this one to be able easily delete all zerro reminders.
 * */
export const getDataAccountId = createSelector([getAccounts], accounts => {
  for (const id in accounts) {
    if (accounts[id].title === DATA_ACC_NAME) return id
  }
})

export const prepareDataAccount: AppThunk = (dispatch, getState) => {
  let state = getState()
  const user = getRootUser(state)
  if (!user) return
  // If no data account create one
  let dataAccId = getDataAccountId(state)
  if (!dataAccId) {
    const acc = makeAccount({
      title: DATA_ACC_NAME,
      user: user.id,
      instrument: user.currency,
    })
    dispatch(applyClientPatch({ account: [acc] }))
    dataAccId = acc.id
  }
}
