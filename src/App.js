import React, { Component } from 'react'
import styled from 'styled-components'

import './App.css'
import { StoreContext } from './Store/'
import { parseData } from './Store/parseData'
import { zenApi } from './Store/api'
import Transaction from './Transaction'

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

class Filter {
  constructor(conditions) {
    const defaultConditions = {
      search: null,
      isIncome: true,
      isOutcome: true,
      isTransition: true,
      deleted: false,
      fromDate: null,
      toDate: null,
      tags: null,
      accounts: null,
      amount: null
    }
    this.conditions = { ...defaultConditions, ...conditions }
  }

  conditions = {}

  check(transaction, cnd = this.conditions) {
    return true
  }
}

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
    const transaction = this.data.transaction
    return (
      <Body>
        <Menu>
          <button onClick={() => console.log(this.state)}>Log state</button>
          <button onClick={() => console.log(this.context)}>Log context</button>
        </Menu>
        <Content>
          {transaction.list &&
            transaction.list
              .map(id => <Transaction data={transaction[id]} key={id} />)
              .slice(0, this.data.showFirst)}
        </Content>
      </Body>
    )
  }
}

export default App
