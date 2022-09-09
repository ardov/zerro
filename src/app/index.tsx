import React from 'react'
import { Provider } from 'react-redux'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import { StyledEngineProvider } from '@mui/material/styles'
import ruDateLocale from 'date-fns/locale/ru'
import { initSentry, sendEvent } from '@shared/helpers/tracking'
import { appVersion } from '@shared/config'
import { TDiff } from '@shared/types'
import { store } from '@store'
import { bindWorkerToStore } from '@worker'
import { applyClientPatch, resetData } from '@store/data'
import GlobalErrorBoundary from './GlobalErrorBoundary'
import { AppThemeProvider } from './AppThemeProvider'
import App from './App'

initSentry()
bindWorkerToStore(store.dispatch)
createZerroInstance(store)

export const MainApp = () => (
  <GlobalErrorBoundary>
    <StyledEngineProvider injectFirst>
      <Provider store={store}>
        <LocalizationProvider
          dateAdapter={AdapterDateFns}
          locale={ruDateLocale}
        >
          <AppThemeProvider>
            <App />
          </AppThemeProvider>
        </LocalizationProvider>
      </Provider>
    </StyledEngineProvider>
  </GlobalErrorBoundary>
)

// TODO: add event on version update
// sendEvent('Version Update: ' + appVersion)

/** `zerro` can be used in console to access state and modify data */
function createZerroInstance(s: typeof store) {
  // @ts-ignore
  window.zerro = {
    get state() {
      return s.getState()
    },
    // @ts-ignore
    env: import.meta.env,
    logsShow: false,
    logs: {},
    resetData: () => s.dispatch(resetData()),
    applyClientPatch: (patch: TDiff) => s.dispatch(applyClientPatch(patch)),
  }
}
