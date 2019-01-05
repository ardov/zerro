import React, { Component } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import styled from 'styled-components'

import MyTransactions from './MyTransactions/'

import { StoreContext } from './Store/'
import Transaction from './TransactionList/Transaction'
import TransactionList from './TransactionList/'
import Filter from './Filter'
import DetailsPanel from './DetailsPanel'
import Header from './Header'

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
`

class App extends Component {
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
    const transactions = this.actions.getTransactions()
    return (
      <BrowserRouter>
        <div>
          <Header />
          <Body>
            <Route path="/" exact component={MyTransactions} />
            <Menu>
              <Filter />
            </Menu>
            <Content>
              <TransactionList transactions={transactions} />
            </Content>
            <DetailsPanel />
          </Body>
        </div>
      </BrowserRouter>
    )
  }
}

export default App
