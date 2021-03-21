import React from 'react'
import { Box } from '@material-ui/core'
import AccountList from 'components/AccountList'
import { Helmet } from 'react-helmet'

export default function Accounts() {
  return (
    <>
      <Helmet>
        <title>Счета | Zerro</title>
        <meta name="description" content="Список счетов" />
        <link rel="canonical" href="https://zerro.app/accounts" />
      </Helmet>

      <Box p={2} pb={8} mx="auto" maxWidth={320}>
        <AccountList />
      </Box>
    </>
  )
}
