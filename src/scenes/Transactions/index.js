import React from 'react'
import TransactionList from 'components/TransactionList'
import DetailsPanel from 'components/DetailsPanel'
import AccountList from 'components/AccountList'
import { Box, Drawer, useMediaQuery } from '@material-ui/core'
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
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  return (
    <Box display="flex">
      <Box
        p={3}
        width={280}
        height="100vh"
        overflow="auto"
        display={{ xs: 'none', md: 'block' }}
      >
        <AccountList />
      </Box>

      <StyledTransactionList />

      <SidePanel
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="right"
        open={!isMobile}
      >
        <DetailsPanel />
      </SidePanel>
    </Box>
  )
}
