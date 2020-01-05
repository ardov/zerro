import { combineReducers } from 'redux-starter-kit'

import tag from './tags'
import budget from './budgets'
import transaction from './transactions'

export default combineReducers({
  tag,
  budget,
  transaction,
})
