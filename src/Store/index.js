import { configureStore } from 'redux-starter-kit'
import ZenApi from 'services/ZenApi'
import { getDataFromLS } from 'logic/localData'

import data from './data'
import diff from './diff'

import filterConditions from './filterConditions'
import openedTransaction from './openedTransaction'
import token from './token'
import selectedTransactions from './selectedTransactions'
import isPending from './isPending'

export const store = configureStore({
  reducer: {
    data,
    diff,
    isPending,
    filterConditions,
    openedTransaction,
    selectedTransactions,
    token,
  },
  preloadedState: getInitialState(),
})

function getInitialState() {
  return {
    data: getDataFromLS(),
    token: ZenApi.getLocalToken(),
  }
}
