import React from 'react'
import ZenApi from '../services/api'
import Cookies from '../services/cookies'
import LocalStorage from '../services/localstorage'
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
    ZenApi.getData(
      res => {
        this.setState(parseData(res), this.saveData)
      },
      { lastSync: this.state.lastSync }
    )
  }

  saveData = () => {
    const state = this.state
    LocalStorage.set('data', {
      lastSync: state.lastSync,
      instrument: state.instrument,
      country: state.country,
      company: state.company,
      user: state.user,
      account: state.account,
      tag: state.tag,
      // budget: state.budget,
      merchant: state.merchant,
      reminder: state.reminder,
      reminderMarker: state.reminderMarker,
      transaction: state.transaction
    })
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
    ZenApi.getData(
      res => {
        this.setState(parseData(res))
      },
      { lastSync: this.state.lastSync, changed: changed }
    )
  }

  initState = () => {
    const localToken = Cookies.get('token')
    const localData = LocalStorage.get('data')
    console.log('Token + data', localToken, localData)

    if (localToken && localData) {
      this.setState(() => {
        return { ...localData, ...{ token: localToken } }
      }, this.updateData)
    } else if (localToken) {
      this.updateData()
    } else {
      ZenApi.auth(token => {
        Cookies.set('token', token)
        this.setState(() => {
          return { token: token }
        }, this.updateData)
      })
    }
  }

  /****************************************************************
   * RENDER
   ****************************************************************/
  render() {
    const value = {
      data: this.state,
      actions: {
        initState: this.initState,
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
