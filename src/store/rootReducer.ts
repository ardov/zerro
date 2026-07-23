import { combineReducers } from '@reduxjs/toolkit'

import data from './data'
import displayCurrency from './displayCurrency'
import sync from './sync'
import token from './token'
import view from './view'

export const rootReducer = combineReducers({
  data,
  sync,
  token,
  displayCurrency,
  view,
})

export type RootState = ReturnType<typeof rootReducer>
