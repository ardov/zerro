import React from 'react'
import zenApi from './api'
import { parseData, populate } from './functions'

export const StoreContext = React.createContext()

export default class Store extends React.Component {
  state = {
    // DATA FROM ZENMONEY
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

    // TOKEN
    token: null,

    selectedTransactions: [],
    // UI
    updatingData: false,
    filterConditions: {
      search: null,
      isIncome: true,
      isOutcome: true,
      isTransition: true,
      deleted: false,
      fromDate: null,
      toDate: null,
      tags: null,
      accounts: null,
      amountFrom: null,
      amountTo: null
    },
    showFirst: 200
  }

  /****************************************************************
   * METHODS
   ****************************************************************/
  updateData = () => {
    zenApi.getData(
      res => {
        this.setState(parseData(res))
      },
      { lastSync: this.state.lastSync }
    )
  }

  getElement = (type, id) => {
    return populate(this.state[type][id], this.state)
  }

  getTransactions = () => {
    const transactions = this.state.transaction
    const list = []
    for (const id in transactions) {
      list.push(populate(transactions[id], this.state))
    }
    return list.sort((a, b) => b.date - a.date)
  }
  // getFilteredTransactions = (cnd = this.filterConditions) => {
  //   const transaction = this.state.transaction
  //   transaction.filter
  // }

  /****************************************************************
   * RENDER
   ****************************************************************/
  render() {
    const value = {
      data: this.state,
      actions: {
        updateData: this.updateData,
        getElement: this.getElement,
        getTransactions: this.getTransactions
      }
    }
    return (
      <StoreContext.Provider value={value}>
        {this.props.children}
      </StoreContext.Provider>
    )
  }
}

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
      amountFrom: null,
      amountTo: null
    }
    this.conditions = { ...defaultConditions, ...conditions }
  }

  conditions = {}

  check(list, cnd = this.conditions) {
    return true
  }
}
