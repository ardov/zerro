import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import * as Sentry from '@sentry/browser'

import 'normalize.css'
import './index.scss'

import App from './App'
import * as serviceWorker from './serviceWorker'
import { store } from './store'
import GlobalErrorBoundary from 'components/GlobalErrorBoundary'
import sendEvent from 'helpers/sendEvent'

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://2e8d2396a5a94b289b7a0f50b0df69f5@sentry.io/1869871',
  })
}

ReactDOM.render(
  <GlobalErrorBoundary>
    <Provider store={store}>
      <App />
    </Provider>
  </GlobalErrorBoundary>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
const swConfig = {
  onUpdate: registration => {
    registration.unregister().then(() => {
      window.location.reload()
    })
  },
  onSuccess: registration => {
    sendEvent('Version Update: ' + process.env.REACT_APP_VERSION)
  },
}

serviceWorker.register(swConfig)
