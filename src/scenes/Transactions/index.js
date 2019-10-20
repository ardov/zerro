import React from 'react'
import styled from 'styled-components'

import Nav from 'components/Navigation'
import TransactionList from 'components/TransactionList'
import DetailsPanel from 'components/DetailsPanel'
import AccountList from 'components/AccountList'
import Message from 'components/Message'
import { Box, Drawer } from '@material-ui/core'
import { withStyles } from '@material-ui/styles'

const Body = styled.div`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  height: 100vh;
  /* padding-top: 48px; */
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

const SidePanel = withStyles({ root: { width: 400 }, paper: { width: 400 } })(
  Drawer
)

export default function TransactionsView() {
  return (
    <>
      <Message />

      <Box display="flex">
        <Nav />
        <Box p={3} width={280} height="100vh" overflow="auto">
          <AccountList />
        </Box>

        <Box flexGrow={1} height="100vh">
          <StyledTransactionList groupBy={'DAY'} />
        </Box>

        <SidePanel variant="persistent" anchor="right" open={true}>
          <DetailsPanel />
        </SidePanel>
      </Box>
    </>
  )
}
