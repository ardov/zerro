import React, { Component } from 'react'
import styled from 'styled-components'
import logo from './logo.svg'
import './App.css'
import { parseData, saveState } from './helpers'
import { zenApi } from './api'
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
  state = {
    lastSync: 0,
    instrument: {},
    country: {},
    company: {},
    user: {},
    account: {},
    tag: {},
    budget: {},
    merchant: {},
    reminder: {},
    reminderMarker: {},
    transaction: {},

    token: null,
    updatingData: false,
    filter: {},
    showFirst: 20
  }

  componentDidMount() {
    this.updateData()
  }

  updateData() {
    zenApi.getData(res => {
      this.setState(parseData(res))
      // saveState(this.state)
    })
  }

  render() {
    const transaction = this.state.transaction
    return (
      <Body>
        <Menu>
          <button onClick={() => console.log(this.state)}>Show state</button>
        </Menu>
        <Content>
          {transaction.list &&
            transaction.list
              .map(id => <Transaction data={transaction[id]} key={id} />)
              .slice(0, this.state.showFirst)}
        </Content>
      </Body>
    )
  }
}

export default App
