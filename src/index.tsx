import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import AdapterDateFns from '@material-ui/lab/AdapterDateFns'
import LocalizationProvider from '@material-ui/lab/LocalizationProvider'
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

// @ts-ignore
window.zerro = {
  get state() {
    return store.getState()
  },
  env: process.env,
  logsShow: false,
  logs: {},
  resetData: () => store.dispatch(resetData()),
  applyClientPatch: (patch: Diff) => store.dispatch(applyClientPatch(patch)),
}

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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
const swConfig = {
  onUpdate: (registration: ServiceWorkerRegistration) => {
    registration.unregister().then(() => {
      window.location.reload()
    })
  },
  onSuccess: (registration: ServiceWorkerRegistration) => {
    sendEvent('Version Update: ' + process.env.REACT_APP_VERSION)
  },
}

serviceWorkerRegistration.register(swConfig)
