import { createReducer, createAction } from 'redux-starter-kit'

// ACTIONS
export const checkTransaction = createAction('selectedTransactions/add')
export const uncheckTransaction = createAction('selectedTransactions/remove')
export const uncheckAllTransactions = createAction('selectedTransactions/wipe')

// INITIAL STATE
const initialState = []

// REDUCER
export default createReducer(initialState, {
  [checkTransaction]: (state, action) => [...state, action.payload],
  [uncheckTransaction]: (state, action) =>
    state.filter(id => id !== action.payload),
  [uncheckAllTransactions]: () => []
})

// SELECTORS
export const getSelectedIds = state => state.selectedTransactions
