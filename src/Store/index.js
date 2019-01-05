import React from 'react'
import zenApi from './api'
import { parseData, populate, check } from './functions'

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
    selectedTransaction: null,
    updatingData: false,
    filterConditions: {
      search: null,
      type: 'any',
      showDeleted: false,
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

  updateFilter = conditions => {
    this.setState(state => {
      return { filterConditions: { ...state.filterConditions, ...conditions } }
    })
  }

  selectTransaction = id => {
    this.setState(state => {
      return { selectedTransaction: id }
    })
  }
  deleteTransaction = id => {
    const changed = {
      transaction: { ...this.state.transaction[id], ...{ deleted: true } }
    }

    zenApi.getData(
      res => {
        this.setState(parseData(res))
      },
      { lastSync: this.state.lastSync, changed: changed }
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
    return list
      .filter(check(this.state.filterConditions))
      .sort((a, b) => b.date - a.date)
  }

  /****************************************************************
   * RENDER
   ****************************************************************/
  render() {
    const value = {
      data: this.state,
      actions: {
        updateData: this.updateData,
        getElement: this.getElement,
        getTransactions: this.getTransactions,
        updateFilter: this.updateFilter,
        selectTransaction: this.selectTransaction,
        deleteTransaction: this.deleteTransaction
      }
    }
    return (
      <StoreContext.Provider value={value}>
        {this.props.children}
      </StoreContext.Provider>
    )
  }
}
