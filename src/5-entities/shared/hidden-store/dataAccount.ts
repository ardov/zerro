import { createSelector } from '@reduxjs/toolkit'
import { AppThunk, RootState } from 'store'
import * as core from 'zerro-core/redux'

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
  return core.infrastructure.prepareDataAccount(DATA_ACC_NAME)
}
