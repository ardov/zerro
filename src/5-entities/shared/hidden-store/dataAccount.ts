import { createSelector } from '@reduxjs/toolkit'
import { AppThunk, RootState } from 'store'
// Concrete modules, not the '5-entities/account' barrel: the barrel pulls
// account thunks -> core-next adapter -> selectors -> displayCurrency ->
// fxRateStore -> hidden-store, which re-enters this module mid-init.
import { makeAccount } from '5-entities/account/shared/makeAccount'
import { applyClientPatch } from 'store/data'
import { userModel } from '5-entities/user'
import { TAccountId } from '6-shared/types'

export const DATA_ACC_NAME = '🤖 [Zerro Data]'

/**
 *  This is helper account which is used to store reminders with hidden data.
 *  We need this one to be able easily delete all zerro reminders.
 * */
export const getDataAccountId = createSelector(
  [(state: RootState) => state.data.current.account],
  accounts => {
    for (const id in accounts) {
      if (accounts[id].title === DATA_ACC_NAME) return id as TAccountId
    }
  }
)

export function prepareDataAccount(): AppThunk<TAccountId> {
  return (dispatch, getState) => {
    let state = getState()
    const user = userModel.getRootUser(state)
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
