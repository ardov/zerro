import React, { Component } from 'react'
import styled from 'styled-components'

import Header from 'containers/Header'
import TransactionList from 'containers/TransactionList'
import Filter from 'containers/Filter'
import DetailsPanel from 'containers/DetailsPanel'
import BulkActions from 'containers/BulkActions'
import AccountList from 'containers/AccountList'

const Body = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100vh - 48px);
  overflow: auto;
`
const Menu = styled.div`
  width: 280px;
  padding: 40px;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
`
const Content = styled.div`
  height: 100%;
  flex-grow: 1;
  min-width: 0;
`
const SidePanel = styled.div`
  width: 480px;
  overflow: auto;
`
const StyledBulkActions = styled(BulkActions)`
  margin-top: 24px;
`

export default class TransactionsView extends Component {
  render() {
    return (
      <React.Fragment>
        <Header />
        <Body>
          <Menu>
            <Filter />
            <StyledBulkActions />
            <AccountList />
          </Menu>
          <Content>
            <TransactionList groupBy={'day'} />
          </Content>
          <SidePanel>
            <DetailsPanel />
          </SidePanel>
        </Body>
      </React.Fragment>
    )
  }
}
