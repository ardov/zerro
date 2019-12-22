import { combineReducers } from 'redux-starter-kit'

import tag from './tags'
import budget from './budgets'
import transaction from './transactions'
import serverData from './serverData'

export default combineReducers({
  serverData,
  tag,
  budget,
  transaction,
})
