import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import ruDateLocale from 'date-fns/locale/ru'
// import 'normalize.css'
import './index.scss'
import App from './App'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import { store } from './store'
import GlobalErrorBoundary from 'components/GlobalErrorBoundary'
import { initSentry, sendEvent } from 'helpers/tracking'

initSentry()

ReactDOM.render(
  <GlobalErrorBoundary>
    <Provider store={store}>
      <MuiPickersUtilsProvider utils={DateFnsUtils} locale={ruDateLocale}>
        <App />
      </MuiPickersUtilsProvider>
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

serviceWorkerRegistration.register(swConfig)
