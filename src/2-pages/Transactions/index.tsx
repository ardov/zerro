import { useCallback, useState } from 'react'
import { TransactionList } from '@/3-widgets/transaction/TransactionList'
import {
  transactionScreen,
  TransactionScreenPanel,
} from '@/3-widgets/global/TransactionPreviewDrawer'
import type { TTransactionId } from '@/6-shared/types'
import { track } from '@/6-shared/analytics'
import { useTranslation } from 'react-i18next'
import { Panel } from '@/6-shared/ui/layout/Panel'
import { useColumns } from '@/6-shared/ui/layout/useColumns'
import { Columns } from '@/6-shared/ui/layout/Columns'
import { AccountsPanel } from '@/3-widgets/account/AccountsPanel'

import { useTransactionsPageView } from './useTransactionsPageView'

export default function TransactionsView() {
  const { t } = useTranslation('transactions')
  const layout = useColumns()
  const docked = layout.visible.includes('detail')
  const accountsPanelFits = layout.visible.includes('accounts')
  const [checkedDate, setCheckedDate] = useState<Date | null>(null)
  const view = useTransactionsPageView()
  // One selected editor moves between its column and a modal as space changes.
  const opened = transactionScreen.useValue()
  const openPreview = transactionScreen.useOpen()

  const handleTrOpen = useCallback(
    (id: TTransactionId) => {
      track('transaction_details_viewed', { source: 'transactions_page' })
      openPreview(id)
    },
    [openPreview]
  )

  return (
    <>
      <title>{`${t('pageTitle')} | Zerro`}</title>
      <meta name="description" content={t('pageDescription')} />
      <link rel="canonical" href="https://zerro.app/transactions" />
      <Columns>
        {accountsPanelFits && <AccountsPanel />}

        <Panel>
          <TransactionList
            checkedDate={checkedDate}
            view={view}
            className="grow"
            onTrOpen={handleTrOpen}
            opened={opened}
          />
        </Panel>

        <TransactionScreenPanel
          docked={docked}
          onSelectSimilar={changed => setCheckedDate(new Date(changed))}
        />
      </Columns>
    </>
  )
}
