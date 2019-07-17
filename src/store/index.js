import { configureStore } from 'redux-starter-kit'
import ZenApi from 'services/ZenApi'

import data from './data'
import filterConditions from './filterConditions'
import openedTransaction from './openedTransaction'
import token from './token'
import selectedTransactions from './selectedTransactions'
import isPending from './isPending'

export const store = configureStore({
  reducer: {
    data,
    isPending,
    filterConditions,
    openedTransaction,
    selectedTransactions,
    token,
  },
  preloadedState: { token: ZenApi.getLocalToken() },
})
