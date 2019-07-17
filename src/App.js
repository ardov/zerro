import React, { Component } from 'react'
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
import { connect } from 'react-redux'

import { IntlProvider, addLocaleData } from 'react-intl'
import ru from 'react-intl/locale-data/ru'

import Transactions from 'scenes/Transactions'
import Tags from 'scenes/Tags'
import Auth from 'scenes/Auth'
import Budgets from 'scenes/Budgets'
import { getLoginState } from 'store/token'
import { syncData } from 'logic/sync'
import { getLastSyncTime } from 'store/data/serverTimestamp'
import { getLastChangeTime } from 'store/data/dataSelectors'
import { getPendingState } from 'store/isPending'
import { loadLocalData } from 'logic/localData'

addLocaleData(ru)

const SYNC_DELAY = 10 * 60 * 1000 // 10min
const CHECK_DELAY = 20 * 1000 // 20sec
let timer = null

class App extends Component {
  componentDidMount = () => {
    this.props.loadLocalData().then(this.checkSync)
    window.addEventListener('beforeunload', this.beforeUnload)
  }

  componentWillUnmount = () => {
    window.removeEventListener('beforeunload', this.beforeUnload)
    window.clearTimeout(timer)
  }

  beforeUnload = e => {
    if (this.props.lastChange) {
      window.alert('UNSAVED CHANGES')
      ;(e || window.event).returnValue = null
      return null
    }
  }

  checkSync = () => {
    const checkSync = this.checkSync
    const { lastSync, sync, isLoggedIn, lastChange, isPending } = this.props
    // Regular sync conditions
    const needRegularSync = Date.now() - lastSync > SYNC_DELAY
    const hasUnsavedChanges = !!lastChange
    const itsTimeToSyncChanges = Date.now() - lastChange > CHECK_DELAY

    if (
      isLoggedIn &&
      !isPending &&
      (needRegularSync || (hasUnsavedChanges && itsTimeToSyncChanges))
    ) {
      console.log(`${needRegularSync ? 'regular' : ''}`)
      sync()
    }

    timer = setTimeout(checkSync, CHECK_DELAY)
  }

  render() {
    const { isLoggedIn } = this.props

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
  lastChange: getLastChangeTime(state),
  isPending: getPendingState(state),
})

const mapDispatchToProps = dispatch => ({
  loadLocalData: () => dispatch(loadLocalData()),
  sync: () => dispatch(syncData()),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
