import React from 'react'
import ReactDOM from 'react-dom'
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
import { AppThemeProvider } from 'AppThemeProvider'

initSentry()
bindWorkerToStore(store.dispatch)
createZerroInstance(store)

ReactDOM.render(
  <GlobalErrorBoundary>
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={ruDateLocale}>
        <AppThemeProvider>
          <App />
        </AppThemeProvider>
      </LocalizationProvider>
    </Provider>
  </GlobalErrorBoundary>,
  document.getElementById('root')
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
