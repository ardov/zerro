import { configureStore, Action } from '@reduxjs/toolkit'
import { ThunkAction } from 'redux-thunk'
import ZenApi from 'services/ZenApi'

import data from './dataSlice'
import token from './token'
import isPending from './isPending'
import lastSync from './lastSync'
import theme from './theme'

export const store = configureStore({
  reducer: {
    data,
    isPending,
    lastSync,
    token,
    theme,
  },
  preloadedState: { token: ZenApi.getLocalToken() },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppGetState = typeof store.getState
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>
