import React from 'react'
import styled from 'styled-components'

import Header from 'components/Header'
import TransactionList from 'components/TransactionList'
import DetailsPanel from 'components/DetailsPanel'
import AccountList from 'components/AccountList'
import Message from 'components/Message'

const Body = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  padding-top: 48px;
  overflow: auto;
`
const Menu = styled.div`
  flex-shrink: 0;
  width: 280px;
  padding: 40px;
  overflow: auto;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
`
const StyledTransactionList = styled(TransactionList)`
  flex-grow: 1;
  min-width: 0;
  height: 100%;
`
const SidePanel = styled.div`
  width: 480px;
  overflow: auto;
  border-left: 1px solid rgba(0, 0, 0, 0.1);
`

export default function TransactionsView() {
  return (
    <React.Fragment>
      <Message />
      <Header />
      <Body>
        <Menu>
          <AccountList />
        </Menu>

        <StyledTransactionList groupBy={'DAY'} />

        <SidePanel>
          <DetailsPanel />
        </SidePanel>
      </Body>
    </React.Fragment>
  )
}
