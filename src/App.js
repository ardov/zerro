import React, { Component } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import styled from 'styled-components'

import MyTransactions from './MyTransactions/'

import { StoreContext } from './Store/'
import { parseData } from './Store/functions'
import { zenApi } from './Store/api'
import Transaction from './TransactionList/Transaction'
import Filter from './Filter'

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
const SelectedPanel = styled.section`
  border: 1px solid #eee;
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
    this.setState(state => {
      return {
        selectedTransaction: tr
      }
    })
  }

  componentDidMount() {
    this.actions.updateData()
  }

  render() {
    const transactions = this.actions.getTransactions()
    const selected = this.state.selectedTransaction
    return (
      <BrowserRouter>
        <Body>
          <Route path="/" exact component={MyTransactions} />
          {/* <Route path="/results" component={Results} /> */}
          <Menu>
            <button onClick={() => console.log(this.state)}>Log state</button>
            <button onClick={() => console.log(this.context)}>
              Log context
            </button>
            <button onClick={() => console.log(this.actions.updateData())}>
              Update Data
            </button>
            <button
              onClick={() =>
                console.log(
                  this.context.data.tag['8ab22cb6-ce01-4456-bf8f-0309cfa99def']
                )
              }
            >
              Log tag Data
            </button>
            <Filter />
          </Menu>
          <Content>
            {transactions &&
              transactions
                .map(transaction => (
                  <Transaction
                    data={transaction}
                    key={transaction.id}
                    onClick={e => {
                      this.selectTransaction(transaction)
                    }}
                  />
                ))
                .slice(0, this.data.showFirst)}
          </Content>
          <SelectedPanel>
            <h1>Выбранная</h1>
            {selected && selected.id}
          </SelectedPanel>
        </Body>
      </BrowserRouter>
    )
  }
}

export default App
