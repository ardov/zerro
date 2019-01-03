import React, { Component } from 'react'
import styled from 'styled-components'

import './App.css'
import { StoreContext } from './Store/'
import Transaction from './Transaction'

export default class TransactionList extends Component {
  static contextType = StoreContext
  actions = this.context.actions
  data = this.context.data

  state = {}

  render() {
    const transaction = this.data.transaction
    return <div />
  }
}
