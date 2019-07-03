import { configureStore } from 'redux-starter-kit'
import ZenApi from '../services/ZenApi'
import LocalStorage from '../services/localstorage'

import data from './data'
import changed from './changed'

import filterConditions from './filterConditions'
import openedTransaction from './openedTransaction'
import token from './token'
import selectedTransactions from './selectedTransactions'

export const store = configureStore({
  reducer: {
    data,
    changed,
    filterConditions,
    openedTransaction,
    selectedTransactions,
    token,
  },
  preloadedState: getInitialState(),
})

function getInitialState() {
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
