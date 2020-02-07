import React from 'react'

import { Box } from '@material-ui/core'
import AccountList from 'components/AccountList'

export default function Accounts() {
  return (
    <Box p={2} pb={8} mx="auto" maxWidth={320}>
      <AccountList />
    </Box>
  )
}
