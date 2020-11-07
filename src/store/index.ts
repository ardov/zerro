import { configureStore } from 'redux-starter-kit'
import ZenApi from 'services/ZenApi'

import localData from './localData'
import serverData from './serverData'
import token from './token'
import isPending from './isPending'
import lastSync from './lastSync'
import message from './message'
import theme from './theme'

export const store = configureStore({
  reducer: {
    localData,
    serverData,
    isPending,
    lastSync,
    token,
    message,
    theme,
  },
  preloadedState: { token: ZenApi.getLocalToken() },
})

export type RootState = ReturnType<typeof store.getState>
