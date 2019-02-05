import { createReducer } from 'redux-starter-kit'
import * as actions from './actions'

const openedTransactionReducer = createReducer(null, {
  [actions.openTransaction]: (state, action) => action.payload,
  [actions.closeTransaction]: () => null
})

export default openedTransactionReducer
