import { useCallback } from 'react'
import { TransactionList } from '@/3-widgets/transaction/TransactionList'
import {
  transactionScreen,
  transactionSummaryScreen,
  TransactionScreenPanel,
} from '@/3-widgets/global/TransactionPreviewDrawer'
import { TransactionSummary } from '@/3-widgets/transaction/TransactionSummary'
import { isEmptyClause } from '@/3-widgets/transaction/TransactionList/TopBar/filterModel'
import type { TTransactionId } from '@/6-shared/types'
import { track } from '@/6-shared/analytics'
import { useTranslation } from 'react-i18next'
import { Panel } from '@/6-shared/ui/layout/Panel'
import { useColumns } from '@/6-shared/ui/layout/useColumns'
import { Columns } from '@/6-shared/ui/layout/Columns'
import { AccountsPanel } from '@/3-widgets/account/AccountsPanel'

import { useAppDispatch, useAppSelector } from '@/store'
import { patchTransactionsPage, selectTransactionsPageView } from '@/store/view'
import type { TSummaryChoices } from '@/3-widgets/transaction/TransactionSummary/model'
import { useTransactionsPageView } from './useTransactionsPageView'

export default function TransactionsView() {
  const { t } = useTranslation('transactions')
  const layout = useColumns()
  const docked = layout.visible.includes('detail')
  const accountsPanelFits = layout.visible.includes('accounts')
  const view = useTransactionsPageView()
  const dispatch = useAppDispatch()
  const summaryChoices = useAppSelector(selectTransactionsPageView).summary
  const setSummaryChoices = useCallback(
    (summary: TSummaryChoices) => dispatch(patchTransactionsPage({ summary })),
    [dispatch]
  )
  // One selected editor moves between its column and a modal as space changes.
  const opened = transactionScreen.useValue()
  const openPreview = transactionScreen.useOpen()

  // The summary follows the list: with a filter, a search or checked rows it
  // is what the docked panel rests on, and the button opens it anywhere else.
  const [summaryOpen, setSummaryOpen] = transactionSummaryScreen.use()
  const openSummary = transactionSummaryScreen.useOpenInstead()
  const summaryByDefault =
    view.query.clauses.some(clause => !isEmptyClause(clause)) ||
    !!view.search.trim() ||
    view.checked.length > 0
  const summaryShown =
    !opened && (!!summaryOpen || (docked && summaryByDefault))
  const toggleSummary = useCallback(() => {
    if (!summaryShown) openSummary(true)
    else if (summaryOpen) setSummaryOpen(null)
  }, [summaryShown, summaryOpen, openSummary, setSummaryOpen])

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
            view={view}
            className="grow"
            onTrOpen={handleTrOpen}
            opened={opened}
            summary={{ shown: summaryShown, onToggle: toggleSummary }}
          />
        </Panel>

        <TransactionScreenPanel
          docked={docked}
          summaryByDefault={summaryByDefault}
          summary={onClose => (
            <TransactionSummary
              query={view.query}
              search={view.search}
              checked={view.checked}
              onQueryChange={view.onQueryChange}
              onSearchChange={view.onSearchChange}
              choices={summaryChoices}
              onChoicesChange={setSummaryChoices}
              onClose={onClose}
            />
          )}
        />
      </Columns>
    </>
  )
}
