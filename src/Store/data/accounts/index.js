import { createSlice, createSelector } from 'redux-starter-kit'
import populate from './populate'
import { getUsers } from 'store/data/users'
import { getInstruments } from 'store/data/instruments'
import { wipeData, updateData, updateDataFunc } from 'store/data/commonActions'
import { convertToSyncArray } from 'Utils/converters'

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
  [getInstruments, getUsers, getAccounts],
  (instruments, users, accounts) => {
    const result = {}
    for (const id in accounts) {
      result[id] = populate({ instruments, users }, accounts[id])
    }
    return result
  }
)

export const getPopulatedAccount = (state, id) =>
  getPopulatedAccounts(state)[id]

export const getInBalance = createSelector(
  [getPopulatedAccounts],
  accounts =>
    Object.keys(accounts)
      .map(id => accounts[id])
      .filter(acc => !acc.archive)
      .filter(acc => acc.inBalance)
      .sort((a, b) => b.balance - a.balance)
)

export const getOutOfBalance = createSelector(
  [getPopulatedAccounts],
  accounts =>
    Object.keys(accounts)
      .map(id => accounts[id])
      .filter(acc => !acc.archive)
      .filter(acc => !acc.inBalance)
      .sort((a, b) => b.balance - a.balance)
)
