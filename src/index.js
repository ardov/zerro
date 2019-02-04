import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { configureStore } from 'redux-starter-kit'
import reducer from './store/reducers'

import 'normalize.css'
import './index.css'
import 'antd/dist/antd.css'

import App from './App'
import * as serviceWorker from './serviceWorker'
import ZenApi from './services/ZenApi'
import LocalStorage from './services/localstorage'

if (process.env.NODE_ENV !== 'production') {
  const { whyDidYouUpdate } = require('why-did-you-update')
  whyDidYouUpdate(React)
}

const defaultState = {
  // DATA FROM ZENMONEY
  lastSync: 0,

  instrument: {},
  country: {},
  company: {},
  user: {},

  account: {},
  tag: {},
  budget: {},
  merchant: {},
  reminder: {},
  reminderMarker: {},
  transaction: {},
  fakeTransaction: {},

  // TOKEN
  token: null,

  // selectedTransactions: [],
  // UI
  openedTransaction: null,
  // updatingData: false,
  filterConditions: {}
  // showFirst: 200
}

const getInitialState = () => {
  const localToken = ZenApi.getLocalToken()
  const localData = LocalStorage.get('data')
  if (localToken && localData) {
    return { ...defaultState, ...localData, token: localToken }
  }
  if (localToken) {
    return { ...defaultState, token: localToken }
  }
  return defaultState
}

const store = configureStore({
  reducer: reducer,
  preloadedState: getInitialState()
})

console.log('Initial state: ', store.getState())

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
