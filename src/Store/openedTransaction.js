import { createReducer, createAction } from 'redux-starter-kit'

//ACTIONS
export const openTransaction = createAction('openedTransaction/open')
export const closeTransaction = createAction('openedTransaction/close')

//REDUCER
export default createReducer(null, {
  [openTransaction]: (state, action) => action.payload,
  [closeTransaction]: () => null
})

//SELECTORS
export const getOpenedId = state => state.openedTransaction
