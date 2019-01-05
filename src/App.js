import React, { Component } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'

import { IntlProvider, addLocaleData } from 'react-intl'
import ru from 'react-intl/locale-data/ru'

import { StoreContext } from './Store/'
import TransactionsView from './TransactionsView/'

addLocaleData(ru)

export default class App extends Component {
  static contextType = StoreContext

  componentDidMount() {
    this.context.actions.updateData()
  }

  render() {
    return (
      <IntlProvider locale="ru">
        <BrowserRouter>
          <Route path="/" exact component={TransactionsView} />
        </BrowserRouter>
      </IntlProvider>
    )
  }
}
