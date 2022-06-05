import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import ruDateLocale from 'date-fns/locale/ru'
import App from './App'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import { store } from './store'
import GlobalErrorBoundary from 'components/GlobalErrorBoundary'
import { initSentry, sendEvent } from 'helpers/tracking'
import { bindWorkerToStore } from 'worker'
import { applyClientPatch, resetData } from 'store/data'
import { Diff } from 'types'
import { AppThemeProvider } from './AppThemeProvider'
import { StyledEngineProvider } from '@mui/material/styles'

initSentry()
bindWorkerToStore(store.dispatch)
createZerroInstance(store)

// @ts-ignore
window.tst = testNewFLow

const container = document.getElementById('root')
if (!container) throw new Error('No root container')
const root = createRoot(container)

root.render(
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

// Register service worker fot app to work offline.
// Learn more here http://bit.ly/CRA-PWA
serviceWorkerRegistration.register({
  onUpdate: (registration: ServiceWorkerRegistration) => {
    registration.unregister().then(() => {
      window.location.reload()
    })
  },
  onSuccess: (registration: ServiceWorkerRegistration) => {
    sendEvent('Version Update: ' + process.env.REACT_APP_VERSION)
  },
})

/** `zerro` can be used in console to access state and modify data */
function createZerroInstance(s: typeof store) {
  // @ts-ignore
  window.zerro = {
    get state() {
      return s.getState()
    },
    env: process.env,
    logsShow: false,
    logs: {},
    resetData: () => s.dispatch(resetData()),
    applyClientPatch: (patch: Diff) => s.dispatch(applyClientPatch(patch)),
  }
}
