import React from 'react'
import zenApi from './api'
import { parseData } from './parseData'

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
    filter: {},
    showFirst: 200
  }

  /****************************************************************
   * METHODS
   ****************************************************************/
  updateData = () => {
    zenApi.getData(res => {
      this.setState(parseData(res))
    })
  }

  /****************************************************************
   * RENDER
   ****************************************************************/
  render() {
    const value = {
      data: this.state,
      actions: {
        updateData: this.updateData
      }
    }
    return (
      <StoreContext.Provider value={value}>
        {this.props.children}
      </StoreContext.Provider>
    )
  }
}
