import React, { Component } from 'react'
import TransactionList from './TransactionList'
import { Drawer } from '@material-ui/core'

export default class TransactionsDrawer extends Component {
  render() {
    const {
      ids,
      conditions,
      groupBy = 'DAY',
      sortType,
      ascending,

      onClose,
      open,
      ...rest
    } = this.props

    return (
      <Drawer anchor="right" onClose={onClose} open={open} {...rest}>
        <div style={{ height: '100vh' }}>
          <TransactionList
            {...{ ids, conditions, groupBy, sortType, ascending }}
          />
        </div>
      </Drawer>
    )
  }
}
