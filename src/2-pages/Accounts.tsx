import React from 'react'
import { Box } from '@mui/material'
import AccountList from '3-widgets/account/AccountList'
import { Helmet } from 'react-helmet'
import { DebtorList } from '3-widgets/DebtorList'
import { useTranslation } from 'react-i18next'

export default function Accounts() {
  const { t } = useTranslation('accounts')
  return (
    <>
      <Helmet>
        <title>{t('pageTitle')} | Zerro</title>
        <meta name="description" content={t('pageDescription')} />
        <link rel="canonical" href="https://zerro.app/accounts" />
      </Helmet>

      <Box p={2} pb={8} mx="auto" maxWidth={320}>
        <AccountList />
        <DebtorList />
      </Box>
    </>
  )
}
