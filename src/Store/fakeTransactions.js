import { createAction, createReducer } from 'redux-starter-kit'

//ACTIONS
export const addFakeTransaction = createAction('fakeTransactions/add')
export const removeFakeTransaction = createAction('fakeTransactions/remove')

//REDUCER
export default createReducer(
  {},
  {
    [addFakeTransaction]: (state, action) => ({
      ...state,
      [action.payload.id]: action.payload
    }),
    [removeFakeTransaction]: (state, action) => ({
      ...state,
      [action.payload]: undefined
    })
  }
)
