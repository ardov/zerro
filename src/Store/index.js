import { configureStore, combineReducers } from 'redux-starter-kit'
import ZenApi from '../services/ZenApi'
import LocalStorage from '../services/localstorage'

import dataReducer from './data'
import fakeTransactionsReducer from './fakeTransactions'
import filterConditionsReducer from './filterConditions'
import openedTransactionReducer from './openedTransaction'
import tokenReducer from './token'

const rootReducer = combineReducers({
  data: dataReducer,
  fakeTransactions: fakeTransactionsReducer,
  filterConditions: filterConditionsReducer,
  openedTransaction: openedTransactionReducer,
  token: tokenReducer
})

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
