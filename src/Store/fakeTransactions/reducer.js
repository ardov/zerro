import * as actions from './actions'
import { createReducer } from 'redux-starter-kit'

const fakeTransactionsReducer = createReducer(
  {},
  {
    [actions.addFakeTransaction]: (state, action) => ({
      ...state,
      [action.payload.id]: action.payload
    }),
    [actions.removeFakeTransaction]: (state, action) => ({
      ...state,
      [action.payload]: undefined
    })
  }
)

export default fakeTransactionsReducer
