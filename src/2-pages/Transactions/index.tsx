import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { TransactionList } from '3-widgets/transaction/TransactionList'
import {
  TrEmptyState,
  TransactionPreview,
} from '3-widgets/transaction/TransactionPreview'
import {
  transactionScreen,
  useTransactionScreenDocked,
} from '3-widgets/global/TransactionPreviewDrawer'
import type { TTransactionId } from '6-shared/types'
import { track } from '6-shared/analytics'
import { useTranslation } from 'react-i18next'

import { useTransactionsPageView } from './useTransactionsPageView'

export default function TransactionsView() {
  const { t } = useTranslation('transactions')
  const docked = useTransactionScreenDocked()
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
      <div className="flex h-screen">
        <div className="flex min-w-0 grow justify-center p-0 md:p-4">
          <div className="surface-card shadow-elevation-1 flex max-w-[560px] flex-1 overflow-hidden pb-14 md:pb-0">
            <TransactionList
              checkedDate={checkedDate}
              view={view}
              className="grow"
              onTrOpen={handleTrOpen}
              opened={opened}
            />
          </div>
        </div>

        {docked && (
          <div className="w-[360px] shrink-0 overflow-auto bg-card">
            <DockedPreview onSelectSimilar={setCheckedDate} />
          </div>
        )}
      </div>
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
