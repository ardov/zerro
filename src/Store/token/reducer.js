import * as actions from './actions'
import { createReducer } from 'redux-starter-kit'

const tokenReducer = createReducer(null, {
  [actions.setToken]: (state, action) => action.payload
})

export default tokenReducer
