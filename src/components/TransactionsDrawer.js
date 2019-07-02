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
    const props = this.props
    const listOptions = {
      ids: props.ids,
      conditions: props.conditions,
      groupBy: props.groupBy || 'day',
      sortType: props.sortType,
      ascending: props.ascending,
    }

    return (
      <StyledDrawer
        placement="right"
        closable={true}
        width={500}
        onClose={props.onClose}
        visible={props.visible}
        {...props}
      >
        <div style={{ height: '100vh' }}>
          <TransactionList {...listOptions} />
        </div>
      </StyledDrawer>
    )
  }
}
