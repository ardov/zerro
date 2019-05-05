import { createAction, createReducer } from 'redux-starter-kit'

//ACTIONS
export const addFakeTransaction = createAction('fakeTransactions/add')
export const removeFakeTransaction = createAction('fakeTransactions/remove')

//REDUCER
const initialState = {}
export default createReducer(initialState, {
  [addFakeTransaction]: (state, action) => ({
    ...state,
    [action.payload.id]: action.payload
  }),
  [removeFakeTransaction]: (state, action) => ({
    ...state,
    [action.payload.id]: undefined
  })
})

//SELECTOR
export const getFakeTransaction = (state, id) => state.fakeTransaction[id]
