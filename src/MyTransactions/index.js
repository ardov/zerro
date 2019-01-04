import React, { Component } from 'react'
import styled from 'styled-components'

import { StoreContext } from '../Store/'

export default class TransactionList extends Component {
  static contextType = StoreContext
  actions = this.context.actions
  data = this.context.data

  state = {}

  render() {
    return <div />
  }
}
