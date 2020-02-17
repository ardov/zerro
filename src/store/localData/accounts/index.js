import { createSlice, createSelector } from 'redux-starter-kit'
import populate from './populate'
import { getInstruments } from 'store/serverData'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import { convertToSyncArray } from 'helpers/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const slice = createSlice({
  slice: 'account',
  initialState,
  reducers: {
    setAccount: (state, { payload }) => {
      const accounts = Array.isArray(payload) ? payload : [payload]
      accounts.forEach(acc => {
        state[acc.id] = acc
      })
    },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      removeSyncedFunc(state, payload.syncStartTime)
    },
  },
})

// REDUCER
export default slice.reducer

// ACTIONS
export const { setAccount } = slice.actions

// SELECTORS
const getServerAccounts = state => state.serverData.account
const getChangedAccounts = state => state.localData.account

export const getAccounts = createSelector(
  [getServerAccounts, getChangedAccounts],
  (serverAccounts, changedAccounts) => ({
    ...serverAccounts,
    ...changedAccounts,
  })
)

export const getAccount = (state, id) => getAccounts(state)[id]

export const getAccountsToSync = state =>
  convertToSyncArray(getChangedAccounts(state))

// Used only for CSV
// TODO: remove
export const getPopulatedAccounts = createSelector(
  [getInstruments, getAccounts],
  (instruments, accounts) => {
    const result = {}
    for (const id in accounts) {
      result[id] = populate({ instruments }, accounts[id])
    }
    return result
  }
)

export const getAccountList = createSelector([getAccounts], accounts =>
  Object.values(accounts).sort((a, b) => b.balance - a.balance)
)

export const getCredits = createSelector([getAccountList], list =>
  list.filter(a => !a.archive && a.balance < 0)
)

export const getAccountsInBudget = createSelector([getAccountList], accounts =>
  accounts.filter(
    a => a.title.endsWith('📍') || (a.inBalance && a.type !== 'debt')
  )
)

export const getSavingAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(
    a =>
      !a.title.endsWith('📍') && !a.archive && !a.inBalance && a.type !== 'debt'
  )
)
