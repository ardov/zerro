import { combineReducers } from 'redux-starter-kit'
import serverTimestamp from './serverTimestamp'
import instrument from './instruments'
import country from './_countries'
import company from './_companies'
import user from './users'
import account from './accounts'
import tag from './tags'
import budget from './budgets'
import merchant from './merchants'
import reminder from './_reminders'
import reminderMarker from './_reminderMarkers'
import transaction from './transactions'

export default combineReducers({
  serverTimestamp,
  instrument,
  country,
  company,
  user,
  account,
  tag,
  budget,
  merchant,
  reminder,
  reminderMarker,
  transaction,
})
