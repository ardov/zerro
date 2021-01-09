import { createSlice, createSelector } from '@reduxjs/toolkit'
import { populate, PopulatedAccount } from './populate'
import { getInstruments } from 'store/serverData'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import { convertToSyncArray } from 'helpers/converters'
import { Account, AccountId, ZmAccount } from 'types'
import { RootState } from 'store'

// INITIAL STATE
const initialState = {} as {
  [key: string]: Account
}

// SLICE
const slice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccount: (state, { payload }) => {
      const accounts = Array.isArray(payload) ? payload : [payload]
      accounts.forEach(acc => {
        state[acc.id] = acc
      })
    },
  },
  extraReducers: builder => {
    builder
      .addCase(wipeData, () => initialState)
      .addCase(updateData, (state, { payload }) => {
        removeSyncedFunc(state, payload.syncStartTime)
      })
  },
})

// REDUCER
export default slice.reducer

// ACTIONS
export const { setAccount } = slice.actions

// SELECTORS
const getServerAccounts = (state: RootState) => state.serverData.account
const getChangedAccounts = (state: RootState) => state.localData.account

export const getAccounts = createSelector(
  [getServerAccounts, getChangedAccounts],
  (serverAccounts, changedAccounts) => ({
    ...serverAccounts,
    ...changedAccounts,
  })
)

export const getAccount = (state: RootState, id: AccountId) =>
  getAccounts(state)[id]

export const getAccountsToSync = (state: RootState): ZmAccount[] =>
  convertToSyncArray(getChangedAccounts(state)) as ZmAccount[]

// Used only for CSV
// TODO: remove
export const getPopulatedAccounts = createSelector(
  [getInstruments, getAccounts],
  (instruments, accounts) => {
    const result = {} as { [x: string]: PopulatedAccount }
    for (const id in accounts) {
      result[id] = populate({ instruments }, accounts[id])
    }
    return result
  }
)

export const getAccountList = createSelector([getAccounts], accounts =>
  Object.values(accounts).sort((a, b) => b.balance - a.balance)
)

export const getDebtAccountId = createSelector([getAccountList], accounts => {
  for (const acc of accounts) {
    if (acc.type === 'debt') return acc.id
  }
})

export const getInBudgetAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(isInBudget)
)

export const getSavingAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(a => !isInBudget(a) && a.type !== 'debt')
)

function isInBudget(a: Account) {
  if (a.type === 'debt') return false
  if (a.title.endsWith('📍')) return true
  return a.inBalance
}
