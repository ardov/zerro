import React, { Component } from 'react'
import styled from 'styled-components'
import { Drawer } from 'antd'
import TransactionList from './TransactionList'

const StyledDrawer = styled(Drawer)`
  & .ant-drawer-body {
    padding: 0;
  }
`

export default class TransactionsDrawer extends Component {
  render() {
    const {
      ids,
      conditions,
      groupBy = 'day',
      sortType,
      ascending,

      onClose,
      visible,
      ...rest
    } = this.props

    return (
      <StyledDrawer
        placement="right"
        closable={true}
        width={500}
        onClose={onClose}
        visible={visible}
        {...rest}
      >
        <div style={{ height: '100vh' }}>
          <TransactionList
            {...{ ids, conditions, groupBy, sortType, ascending }}
          />
        </div>
      </StyledDrawer>
    )
  }
}
