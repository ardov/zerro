import React, { Component } from 'react'
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
import { connect } from 'react-redux'

import { IntlProvider, addLocaleData } from 'react-intl'
import ru from 'react-intl/locale-data/ru'

import Transactions from './scenes/Transactions'
import Tags from './scenes/Tags'
import Auth from './scenes/Auth'
import Budgets from './scenes/Budgets'
import { getLoginState } from './store/token'
import { syncData } from 'store/diff/sync'
import { getLastSyncTime } from './store/data'
import { getChangedNum } from 'store/diff'

addLocaleData(ru)

const SYNC_DELAY = 10 * 60 * 1000 // 10min
const CHECK_DELAY = 5 * 1000 // 5sec

class App extends Component {
  state = { syncTimer: null }

  componentDidMount = () => {
    this.checkSync()
    window.addEventListener('beforeunload', this.beforeUnload)
  }

  componentWillUnmount = () => {
    window.removeEventListener('beforeunload', this.beforeUnload)
    clearInterval(this.state.syncTimer)
  }

  beforeUnload = e => {
    if (this.props.isUnsaved) {
      window.alert('UNSAVED CHANGES')
      ;(e || window.event).returnValue = null
      return null
    }
  }

  checkSync = () => {
    const checkSync = this.checkSync
    const { lastSync, sync, isLoggedIn, isUnsaved } = this.props

    if (isLoggedIn && (isUnsaved || Date.now() - lastSync > SYNC_DELAY)) {
      sync()
    }

    const syncTimer = setTimeout(checkSync, CHECK_DELAY)
    this.setState({ syncTimer })
  }

  render() {
    const isLoggedIn = this.props.isLoggedIn

    return (
      <IntlProvider locale="ru">
        <BrowserRouter>
          <Switch>
            <Route
              path="/transactions"
              render={() => (isLoggedIn ? <Transactions /> : <Auth />)}
            />
            <Route
              path="/tags"
              render={() => (isLoggedIn ? <Tags /> : <Auth />)}
            />
            <Route
              path="/budget"
              render={() => (isLoggedIn ? <Budgets /> : <Auth />)}
            />
            <Route
              path="/login"
              render={() =>
                isLoggedIn ? <Redirect to="/transactions" /> : <Auth />
              }
            />
            <Redirect to="/transactions" />
          </Switch>
        </BrowserRouter>
      </IntlProvider>
    )
  }
}

const mapStateToProps = state => ({
  isLoggedIn: getLoginState(state),
  lastSync: getLastSyncTime(state),
  isUnsaved: getChangedNum(state),
})

const mapDispatchToProps = dispatch => ({
  sync: () => dispatch(syncData()),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
