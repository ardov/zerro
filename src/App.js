import React, { Component } from 'react'
import styled from 'styled-components'

import { StoreContext } from './Store/'
import { parseData } from './Store/functions'
import { zenApi } from './Store/api'
import Transaction from './TransactionList/Transaction'

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
    filter: {}
  }

  componentDidMount() {
    this.actions.updateData()
  }

  render() {
    const transactions = this.actions.getTransactions()
    return (
      <Body>
        <Menu>
          <button onClick={() => console.log(this.state)}>Log state</button>
          <button onClick={() => console.log(this.context)}>Log context</button>
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
        </Menu>
        <Content>
          {transactions &&
            transactions
              .map(transaction => (
                <Transaction data={transaction} key={transaction.id} />
              ))
              .slice(0, this.data.showFirst)}
        </Content>
      </Body>
    )
  }
}

export default App
