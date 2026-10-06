import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { TransactionList } from '@/3-widgets/transaction/TransactionList'
import {
  TrEmptyState,
  TransactionPreview,
} from '@/3-widgets/transaction/TransactionPreview'
import {
  transactionScreen,
  useTransactionScreenDocked,
} from '@/3-widgets/global/TransactionPreviewDrawer'
import type { TTransactionId } from '@/6-shared/types'
import { track } from '@/6-shared/analytics'
import { useTranslation } from 'react-i18next'
import { Panel } from '@/6-shared/ui/layout/Panel'
import {
  panelWidths,
  useAccountsPanelFits,
} from '@/6-shared/ui/layout/panelWidths'
import AccountList from '@/3-widgets/account/AccountList'
import { DebtorList } from '@/3-widgets/DebtorList'

import { useTransactionsPageView } from './useTransactionsPageView'

export default function TransactionsView() {
  const { t } = useTranslation('transactions')
  const docked = useTransactionScreenDocked()
  const accountsPanelFits = useAccountsPanelFits()
  const [checkedDate, setCheckedDate] = useState<Date | null>(null)
  const view = useTransactionsPageView()
  // The same screen the drawer shows elsewhere. On a phone the drawer draws
  // it; at desktop width this page lays it out as a column of its own and the
  // drawer stands aside.
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
      {accountsPanelFits && (
        <Panel className="shrink-0" style={{ width: panelWidths.accounts }}>
          <div className="p-2">
            <AccountList />
            <DebtorList />
          </div>
        </Panel>
      )}

      <Panel contentScrolls className="flex min-w-0 flex-1">
        <TransactionList
          checkedDate={checkedDate}
          view={view}
          className="grow"
          onTrOpen={handleTrOpen}
          opened={opened}
        />
      </Panel>

      {docked && (
        <Panel
          className="shrink-0"
          style={{ width: panelWidths.transactionDetail }}
        >
          <DockedPreview onSelectSimilar={setCheckedDate} />
        </Panel>
      )}
    </>
  )
}

/** The desktop column. It is the transaction screen laid out in place rather
 * than over the page, so Back behaves the same either way. */
const DockedPreview: FC<{ onSelectSimilar: (date: Date) => void }> = ({
  onSelectSimilar,
}) => {
  const [id, setId] = transactionScreen.use()
  const openAnother = transactionScreen.useOpen()
  if (!id) return <TrEmptyState />
  return (
    <TransactionPreview
      id={id}
      key={id}
      onClose={() => setId(null)}
      onOpenOther={openAnother}
      onSelectSimilar={changed => onSelectSimilar(new Date(changed))}
    />
  )
}
