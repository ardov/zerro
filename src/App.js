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

addLocaleData(ru)

const SYNC_DELAY = 10 * 60 * 1000 // 10min

class App extends Component {
  componentDidMount = () => {
    const { lastSync, sync, isLoggedIn } = this.props
    if (isLoggedIn && Date.now() - lastSync > SYNC_DELAY) sync()
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
})

const mapDispatchToProps = dispatch => ({
  sync: () => dispatch(syncData()),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App)
