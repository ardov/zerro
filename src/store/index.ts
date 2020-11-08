import { configureStore } from '@reduxjs/toolkit'
import ZenApi from 'services/ZenApi'

import localData from './localData'
import serverData from './serverData'
import token from './token'
import isPending from './isPending'
import lastSync from './lastSync'
import theme from './theme'

export const store = configureStore({
  reducer: {
    localData,
    serverData,
    isPending,
    lastSync,
    token,
    theme,
  },
  preloadedState: { token: ZenApi.getLocalToken() },
})

export type RootState = ReturnType<typeof store.getState>
