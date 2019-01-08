import React, { Component } from 'react'
import styled from 'styled-components'

import { StoreContext } from '../store/'

import Header from '../Header'
import TransactionList from './TransactionList/'
import Filter from './Filter'
import DetailsPanel from './DetailsPanel'

const Body = styled.div`
  display: flex;
  flex-direction: row;
`
const Menu = styled.div`
  width: 280px;
  padding: 40px;
  /* background: rgba(0, 0, 0, 0.06); */
  border-right: 1px solid rgba(0, 0, 0, 0.1);
`
const Content = styled.div`
  flex-grow: 1;
  padding: 0 40px;
  flex-direction: column;
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
        <Body>
          <Menu>
            <Filter />
          </Menu>
          <Content>
            <TransactionList
              transactions={transactions}
              opened={openedTransaction}
              onTransactionOpen={id => {
                selectTransaction(id)
              }}
            />
          </Content>
          <DetailsPanel />
        </Body>
      </div>
    )
  }
}
