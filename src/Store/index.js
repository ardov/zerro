import { configureStore, combineReducers } from 'redux-starter-kit'
import ZenApi from '../services/ZenApi'
import LocalStorage from '../services/localstorage'

import dataReducer from './data/reducer'
import fakeTransactionsReducer from './fakeTransactions'
import filterConditionsReducer from './filterConditions/reducer'
import openedTransactionReducer from './openedTransaction/reducer'
import tokenReducer from './token'

const rootReducer = combineReducers({
  data: dataReducer,
  fakeTransactions: fakeTransactionsReducer,
  filterConditions: filterConditionsReducer,
  openedTransaction: openedTransactionReducer,
  token: tokenReducer
})

// const defaultState = {
//   // DATA FROM ZENMONEY
//   lastSync: 0,

//   instrument: {},
//   country: {},
//   company: {},
//   user: {},

//   account: {},
//   tag: {},
//   budget: {},
//   merchant: {},
//   reminder: {},
//   reminderMarker: {},
//   transaction: {},
//   fakeTransaction: {},

//   // TOKEN
//   token: null,

//   // selectedTransactions: [],
//   // UI
//   openedTransaction: null,
//   // updatingData: false,
//   filterConditions: {}
//   // showFirst: 200
// }

const getInitialState = () => {
  const localToken = ZenApi.getLocalToken()
  const localData = LocalStorage.get('data')
  if (localToken && localData) {
    return { data: localData, token: localToken }
  }
  if (localToken) {
    return { token: localToken }
  }
  return
}

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: getInitialState()
})
