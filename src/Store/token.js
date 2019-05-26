import { createReducer, createAction } from 'redux-starter-kit'

// ACTIONS
export const setToken = createAction('token/set')

// REDUCER
export default createReducer(null, {
  [setToken]: (state, action) => action.payload
})

// SELECTORS
export const getLoginState = state => !!state.token
