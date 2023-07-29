import React from 'react'
import { Box } from '@mui/material'
import AccountList from 'widgets/AccountList'
import { Helmet } from 'react-helmet'
import { DebtorList } from 'widgets/DebtorList'

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
        <DebtorList />
      </Box>
    </>
  )
}
