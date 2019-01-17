import React, { Component } from 'react'
import styled from 'styled-components'

import { StoreContext } from '../store'
import {
  openTransaction,
  applyChangesToTransaction,
  deleteTransaction,
  restoreTransaction
} from '../store/actions'

import Header from '../Header'
import TransactionList from './TransactionList'
import Filter from './Filter'
import DetailsPanel from './DetailsPanel'
import { Button } from 'antd'

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

  state = {
    limit: 20,
    limitStep: 50
  }

  render() {
    const { getTransactions, getOpened } = this.context.selectors
    const dispatch = this.context.dispatch
    const transactions = getTransactions({ limit: this.state.limit })
    const opened = getOpened()
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
              opened={opened}
              onTransactionOpen={id => {
                dispatch(openTransaction(id))
              }}
            />
            <Button
              onClick={() => {
                this.setState(state => {
                  return { limit: state.limit + state.limitStep }
                })
              }}
            >
              Load more
            </Button>
          </Content>
          <DetailsPanel
            transaction={opened}
            onDelete={id => dispatch(deleteTransaction(id))}
            onRestore={id => dispatch(restoreTransaction(id))}
            onSave={tr => {
              console.log(tr)
              dispatch(applyChangesToTransaction({ id: tr.id, tag: tr.tag }))
            }}
          />
        </Body>
      </div>
    )
  }
}
