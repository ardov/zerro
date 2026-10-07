import type { TTransactionId } from '@/6-shared/types'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'
import { defineScreen } from '@/6-shared/overlays'
import type { core } from '@/zerro-core/redux'

import type { TTransactionListProps } from '../transaction/TransactionList'
import { TransactionList } from '../transaction/TransactionList'
import { useTransactionPreview } from './TransactionPreviewDrawer'

export type TransactionDrawerProps = {
  title?: string
  /** A list someone else has already worked out — the year review's cards.
   * Ids rather than whole transactions: the value has to survive a reload,
   * and the invisible half of the address has no length limit to mind. */
  ids?: TTransactionId[]
  initialQuery?: core.transactions.TTransactionQuery
  initialDate?: TTransactionListProps['initialDate']
}

/** A screen: a list of transactions, described either by a query or by the
 * ids it was handed. */
const transactionListScreen =
  defineScreen<TransactionDrawerProps>('transactionList')

export const useTransactionDrawer = () => transactionListScreen.useOpen()

export const TransactionListDrawer = () => {
  const { t } = useTranslation('common')
  const [value, setValue] = transactionListScreen.use()
  const showTransaction = useTransactionPreview()
  const onClose = useCallback(() => setValue(null), [setValue])
  // The screen value is gone while the drawer slides out. Keep showing what
  // it showed, so the closing list keeps its title and its filter.
  const shown = useCachedValue(value, !!value)
  const { title, ids, initialQuery, initialDate } = shown ?? {}

  return (
    <DrawerSurface
      title={title || t('transactions')}
      controller={{ open: !!value, setOpen: open => !open && onClose() }}
      contentScrolls
    >
      <TransactionList
        transactionIds={ids}
        initialQuery={initialQuery}
        initialDate={initialDate}
        onTrOpen={showTransaction}
        className="grow"
      />
    </DrawerSurface>
  )
}
