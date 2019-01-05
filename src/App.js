import React, { Component } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'

import { StoreContext } from './Store/'
import TransactionsView from './TransactionsView/'

export default class App extends Component {
  static contextType = StoreContext
  actions = this.context.actions
  data = this.context.data

  state = {
    selectedTransaction: null
  }

  selectTransaction = tr => {
    this.actions.selectTransaction(tr.id)
  }

  componentDidMount() {
    this.actions.updateData()
  }

  render() {
    return (
      <BrowserRouter>
        <Route path="/" exact component={TransactionsView} />
      </BrowserRouter>
    )
  }
}
