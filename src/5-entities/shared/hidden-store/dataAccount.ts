import { createSelector } from '@reduxjs/toolkit'
import { AppThunk, RootState } from 'store'
import { executeReduxCommand } from 'core-next/adapters/redux/executeCommand'
import { compileCreateAccount } from 'core-next/zenmoney/accounts'
import { getRootUserId } from 'core-next/zenmoney/users'
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
    const state = getState()
    const dataAccId = getDataAccountId(state)
    if (dataAccId) return dataAccId

    return dispatch(
      executeReduxCommand(
        { type: 'infrastructure.dataAccount.prepare' } as const,
        (currentState, ctx) => {
          const data = currentState.data.current
          const userId = getRootUserId(data)
          if (!userId) throw new Error('No root user')
          const patch = compileCreateAccount(
            data,
            {
              title: DATA_ACC_NAME,
              instrument: data.user[userId].currency,
            },
            ctx
          )
          const accountId = patch.account?.[0].id
          if (!accountId) throw new Error('Data account was not created')
          return { patch, receipt: accountId }
        }
      )
    ) as TAccountId
  }
}
