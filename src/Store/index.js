import { configureStore, combineReducers } from 'redux-starter-kit'
import ZenApi from '../services/ZenApi'
import LocalStorage from '../services/localstorage'

import data from './data'
import fakeTransactions from './fakeTransactions'
import filterConditions from './filterConditions'
import openedTransaction from './openedTransaction'
import token from './token'
import selectedTransactions from './selectedTransactions'

const rootReducer = combineReducers({
  data,
  fakeTransactions,
  filterConditions,
  openedTransaction,
  selectedTransactions,
  token
})

const getInitialState = () => {
  const token = ZenApi.getLocalToken()
  const data = LocalStorage.get('data')
  if (token && data) {
    return { data, token }
  }
  if (token) {
    return { token }
  }
  return
}

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: getInitialState()
})
