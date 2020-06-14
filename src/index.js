import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import * as Sentry from '@sentry/browser'
import { IntlProvider, addLocaleData } from 'react-intl'
import ru from 'react-intl/locale-data/ru'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import ruDateLocale from 'date-fns/locale/ru'
// import 'normalize.css'
import './index.scss'
import App from './App'
import * as serviceWorker from './serviceWorker'
import { store } from './store'
import GlobalErrorBoundary from 'components/GlobalErrorBoundary'
import sendEvent from 'helpers/sendEvent'

addLocaleData(ru)

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    release: process.env.REACT_APP_VERSION,
    dsn: process.env.REACT_APP_SENTRY_DSN,
  })
}

ReactDOM.render(
  <GlobalErrorBoundary>
    <Provider store={store}>
      <IntlProvider locale="ru">
        <MuiPickersUtilsProvider utils={DateFnsUtils} locale={ruDateLocale}>
          <App />
        </MuiPickersUtilsProvider>
      </IntlProvider>
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
