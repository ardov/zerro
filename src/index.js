import React from 'react'
import ReactDOM from 'react-dom'

import 'normalize.css'
import './index.css'
import 'antd/dist/antd.css'

import App from './App'
import Store from './Store/'
import * as serviceWorker from './serviceWorker'

ReactDOM.render(
  <Store>
    <App />
  </Store>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
