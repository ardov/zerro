import React from 'react'
import zenApi from './api'
import { parseData, populate, check } from './functions'
import { getTransactions, getElement, getTags } from './selectors'

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
    openedTransaction: null,
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
      return { openedTransaction: id }
    })
  }

  deleteTransaction = id => {
    const changed = {
      transaction: [
        {
          ...this.state.transaction[id],
          ...{ deleted: true, changed: Date.now() / 1000 }
        }
      ]
    }
    zenApi.getData(
      res => {
        this.setState(parseData(res))
      },
      { lastSync: this.state.lastSync, changed: changed }
    )
  }

  /****************************************************************
   * RENDER
   ****************************************************************/
  render() {
    const value = {
      data: this.state,
      actions: {
        updateData: this.updateData,
        getElement: getElement(this.state, populate),
        getTransactions: getTransactions(this.state, populate, check),
        getTags: getTags(this.state, populate),
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
