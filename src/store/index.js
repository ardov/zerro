import { configureStore } from 'redux-starter-kit'
import ZenApi from 'services/ZenApi'

import data from './data'
import filterConditions from './filterConditions'
import openedTransaction from './openedTransaction'
import token from './token'
import selectedTransactions from './selectedTransactions'
import isPending from './isPending'
import message from './message'
import theme from './theme'

export const store = configureStore({
  reducer: {
    data,
    isPending,
    filterConditions,
    openedTransaction,
    selectedTransactions,
    token,
    message,
    theme,
  },
  preloadedState: { token: ZenApi.getLocalToken() },
})
