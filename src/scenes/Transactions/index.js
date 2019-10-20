import React from 'react'
import Nav from 'components/Navigation'
import TransactionList from 'components/TransactionList'
import DetailsPanel from 'components/DetailsPanel'
import AccountList from 'components/AccountList'
import { Box, Drawer } from '@material-ui/core'
import { withStyles } from '@material-ui/styles'

const StyledTransactionList = props => (
  <Box flexGrow={1} height="100vh" minWidth={0} clone>
    <TransactionList groupBy="DAY" {...props} />
  </Box>
)

const SidePanel = withStyles({
  root: { width: 400 },
  paper: { width: 400 },
})(Drawer)

export default function TransactionsView() {
  return (
    <Box display="flex">
      <Nav />
      <Box p={3} width={280} height="100vh" overflow="auto">
        <AccountList />
      </Box>

      <StyledTransactionList />

      <SidePanel variant="persistent" anchor="right" open={true}>
        <DetailsPanel />
      </SidePanel>
    </Box>
  )
}
