import React, { useState } from 'react'
import TransactionList from 'components/TransactionList'
import AccountList from 'components/AccountList'
import { Box, Drawer, useMediaQuery } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import TransactionPreview from 'components/TransactionPreview'

const useStyles = makeStyles(theme => ({
  drawerWidth: { width: 360 },
}))

const StyledTransactionList = props => (
  <Box flexGrow={1} height="100vh" minWidth={0} clone>
    <TransactionList groupBy="DAY" {...props} />
  </Box>
)

export default function TransactionsView() {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const [opened, setOpened] = useState(null)
  const c = useStyles()
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

      <StyledTransactionList {...{ opened, setOpened }} />

      <Drawer
        classes={
          isMobile ? null : { paper: c.drawerWidth, root: c.drawerWidth }
        }
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="right"
        open={!isMobile || !!opened}
      >
        {opened && (
          <TransactionPreview
            id={opened}
            key={opened}
            onClose={() => setOpened(null)}
          />
        )}
      </Drawer>
    </Box>
  )
}
