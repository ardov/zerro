import { createSelector } from '@reduxjs/toolkit'
import { AppThunk } from 'store'
import { getAccounts, makeAccount } from 'models/account'
import { applyClientPatch } from 'store/data'
import { getRootUser } from 'models/user'
import { TAccountId } from 'shared/types'

export const DATA_ACC_NAME = '🤖 [Zerro Data]'

/**
 *  This is helper account which is used to store reminders with hidden data.
 *  We need this one to be able easily delete all zerro reminders.
 * */
export const getDataAccountId = createSelector([getAccounts], accounts => {
  for (const id in accounts) {
    if (accounts[id].title === DATA_ACC_NAME) return id as TAccountId
  }
})

export function prepareDataAccount(): AppThunk<TAccountId> {
  return (dispatch, getState) => {
    let state = getState()
    const user = getRootUser(state)
    if (!user) {
      throw new Error('No root user')
    }
    let dataAccId = getDataAccountId(state)
    if (dataAccId) return dataAccId

    // If no data account create one
    const acc = makeAccount({
      title: DATA_ACC_NAME,
      user: user.id,
      instrument: user.currency,
    })
    dispatch(applyClientPatch({ account: [acc] }))
    return acc.id
  }
}
