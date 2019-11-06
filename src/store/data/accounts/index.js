import { createSlice, createSelector } from 'redux-starter-kit'
import populate from './populate'
import { getInstruments } from 'store/data/instruments'
import { wipeData, updateData, updateDataFunc } from 'store/data/commonActions'
import { convertToSyncArray } from 'helpers/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'account',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      updateDataFunc(state, payload, 'account')
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getAccounts = state => state.data.account

export const getAccountsToSave = createSelector(
  [getAccounts],
  accounts => convertToSyncArray(accounts)
)

export const getAccount = (state, id) => getAccounts(state)[id]

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

export const getPopulatedAccount = (state, id) =>
  getPopulatedAccounts(state)[id]

export const getAccountList = createSelector(
  [getAccounts],
  accounts => Object.values(accounts).sort((a, b) => b.balance - a.balance)
)

export const getAccountsInBudget = createSelector(
  [getAccountList],
  accounts =>
    accounts.filter(a => !a.archive && a.inBalance && a.type !== 'debt')
)

export const getSavingAccounts = createSelector(
  [getAccountList],
  accounts =>
    accounts.filter(a => !a.archive && !a.inBalance && a.type !== 'debt')
)
