import AccountList from '@/3-widgets/account/AccountList'
import { DebtorList } from '@/3-widgets/DebtorList'
import { useTranslation } from 'react-i18next'

export default function Accounts() {
  const { t } = useTranslation('accounts')
  return (
    <>
      <title>{`${t('pageTitle')} | Zerro`}</title>
      <meta name="description" content={t('pageDescription')} />
      <link rel="canonical" href="https://zerro.app/accounts" />
      <div className="mx-auto max-w-[320px] p-4 pb-16">
        <AccountList />
        <DebtorList />
      </div>
    </>
  )
}
