import React from 'react'
import ZenApi from '../services/api'
import Cookies from '../services/cookies'
import LocalStorage from '../services/localstorage'
import { defaultConditions, check } from '../TransactionFilter/'
import { parseData, populate } from './functions'
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
    filterConditions: defaultConditions,
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

  edit = (type, arr) => {
    const changed = {}
    changed[type] = arr.map(obj => {
      return {
        ...this.state[type][obj.id],
        ...{ tag: obj.tag, changed: Date.now() / 1000 }
      }
    })
    ZenApi.getData(
      res => {
        this.setState(parseData(res))
      },
      { lastSync: this.state.lastSync, changed: changed }
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
        deleteTransaction: this.deleteTransaction,
        edit: this.edit
      }
    }
    return (
      <StoreContext.Provider value={value}>
        {this.props.children}
      </StoreContext.Provider>
    )
  }
}
