import React, { Component } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'

import { IntlProvider, addLocaleData } from 'react-intl'
import ru from 'react-intl/locale-data/ru'

import { StoreContext } from './store/'
import TransactionsView from './TransactionsView/'
import TagsView from './TagsView/'

addLocaleData(ru)

export default class App extends Component {
  static contextType = StoreContext

  componentDidMount() {
    // this.context.actions.updateData()
    this.context.actions.initState()
  }

  render() {
    return (
      <IntlProvider locale="ru">
        <BrowserRouter>
          <div>
            <Route path="/" exact component={TransactionsView} />
            <Route path="/tags" component={TagsView} />
          </div>
        </BrowserRouter>
      </IntlProvider>
    )
  }
}
