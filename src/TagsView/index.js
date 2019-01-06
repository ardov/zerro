import React, { Component } from 'react'
import styled from 'styled-components'

import { StoreContext } from '../Store/'

import Header from '../Header'

const Body = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 100vh;
`
const Menu = styled.div`
  width: 200px;
  padding: 40px;
  background: rgba(0, 0, 0, 0.06);
`
const Content = styled.div`
  flex-grow: 1;
  display: flex;
  padding: 40px;
  flex-direction: column;
  overflow: auto;
  max-height: 100vh;
`

export default class TransactionsView extends Component {
  static contextType = StoreContext

  render() {
    const { selectTransaction, getTransactions } = this.context.actions
    const { openedTransaction } = this.context.data
    const transactions = getTransactions({ limit: 100 })

    return (
      <div>
        <Header />
      </div>
    )
  }
}
