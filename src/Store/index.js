import React from 'react'
import {
  getTransactions,
  getElement,
  getTags,
  getOpened,
  getFilterConditions
} from './selectors'
import reducer from './reducers/'

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
    fakeTransaction: {},

    // TOKEN
    token: null,

    // selectedTransactions: [],
    // UI
    openedTransaction: null,
    // updatingData: false,
    filterConditions: {}
    // showFirst: 200
  }

  /****************************************************************
   * METHODS
   ****************************************************************/

  getState = () => this.state

  dispatch = action => {
    if (typeof action === 'function') {
      action(this.dispatch, this.getState)
    } else {
      console.log('%c' + action.type, 'color: green', action.payload)

      this.setState(state => reducer(state, action))
    }
  }

  /****************************************************************
   * RENDER
   ****************************************************************/
  render() {
    const value = {
      selectors: {
        getElement: getElement(this.state),
        getTransactions: getTransactions(this.state),
        getTags: getTags(this.state),
        getOpened: getOpened(this.state),
        getFilterConditions: getFilterConditions(this.state)
      },
      dispatch: this.dispatch
    }
    return (
      <StoreContext.Provider value={value}>
        {this.props.children}
      </StoreContext.Provider>
    )
  }
}
