import React, { Component } from 'react'
import styled from 'styled-components'
import { connect } from 'react-redux'

import {
  openTransaction,
  applyChangesToTransaction,
  deleteTransaction,
  restoreTransaction
} from '../store/actions'
import { setCondition } from '../store/actions/filter'

import Header from '../Header'
import TransactionList from './TransactionList'
import Filter from './Filter'
import DetailsPanel from './DetailsPanel'
import { Button } from 'antd'
import { getTransactions, getOpened } from '../store/selectors'

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

class TransactionsView extends Component {
  state = {
    limit: 20,
    limitStep: 50
  }

  render() {
    const { transactions, opened, dispatch } = this.props

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
              onSetFilter={condition => dispatch(setCondition(condition))}
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
              dispatch(applyChangesToTransaction({ id: tr.id, tag: tr.tag }))
            }}
          />
        </Body>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  transactions: getTransactions(state)({ limit: 10 }),
  opened: getOpened(state)()
})

// const mapDispatchToProps = dispatch => ({
//   actions: bindActionCreators(TodoActions, dispatch)
// })

export default connect(
  mapStateToProps,
  null
)(TransactionsView)
