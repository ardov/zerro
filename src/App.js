import React, { Component } from 'react'
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom'
import { initState } from './store/actions'

import { IntlProvider, addLocaleData } from 'react-intl'
import ru from 'react-intl/locale-data/ru'

import { StoreContext } from './store'
import TransactionsView from './TransactionsView'
import TagsView from './TagsView'
import Auth from './containers/Auth'

addLocaleData(ru)

export default class App extends Component {
  static contextType = StoreContext

  componentDidMount() {
    this.context.dispatch(initState())
  }

  render() {
    const isLoggedIn = this.context.selectors.getLoginState()

    return (
      <IntlProvider locale="ru">
        <BrowserRouter>
          <Switch>
            <Route
              path="/transactions"
              render={() =>
                isLoggedIn ? <TransactionsView /> : <Redirect to="/login" />
              }
            />
            <Route
              path="/tags"
              render={() =>
                isLoggedIn ? <TagsView /> : <Redirect to="/login" />
              }
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
