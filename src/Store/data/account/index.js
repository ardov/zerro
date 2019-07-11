import { createSlice, createSelector } from 'redux-starter-kit'
import populate from './populate'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'account',
  initialState,
  reducers: {},
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getAccounts = createSelector(
  ['data.account'],
  accounts => accounts
)

export const getAccount = (state, id) => getAccounts(state)[id]

export const getPopulatedAccounts = createSelector(
  ['data.instrument', 'data.user', 'data.account'],
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
