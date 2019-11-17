import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'

import 'normalize.css'
import './index.scss'

import App from './App'
import * as serviceWorker from './serviceWorker'
import { store } from './store'
import GlobalErrorBoundary from 'components/GlobalErrorBoundary'

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
serviceWorker.unregister()
