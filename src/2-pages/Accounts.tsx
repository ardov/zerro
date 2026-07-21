import { Box } from '@mui/material'
import AccountList from '3-widgets/account/AccountList'
import { Helmet } from 'react-helmet-async'
import { DebtorList } from '3-widgets/DebtorList'
import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '6-shared/hooks/useDocumentTitle'

export default function Accounts() {
  const { t } = useTranslation('accounts')
  useDocumentTitle(`${t('pageTitle')} | Zerro`)
  return (
    <>
      <Helmet>
        <meta name="description" content={t('pageDescription')} />
        <link rel="canonical" href="https://zerro.app/accounts" />
      </Helmet>
      <Box sx={{ p: 2, pb: 8, mx: 'auto', maxWidth: 320 }}>
        <AccountList />
        <DebtorList />
      </Box>
    </>
  )
}
