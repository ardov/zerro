import { IconButton } from '@/6-shared/ui/Button'
import type { TTransactionId } from '@/6-shared/types'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SideDrawer } from '@/6-shared/ui/SideDrawer'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { CloseIcon } from '@/6-shared/ui/Icons'
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
  const { title, ids, initialQuery, initialDate } = value ?? {}

  return (
    <SideDrawer
      onClose={onClose}
      open={!!value}
      // Full-width on phones, fixed-width from the small breakpoint.
      className="w-screen sm:w-[360px]"
      aria-label={title || t('transactions')}
    >
      <div className="flex h-screen min-w-80 flex-col">
        <div className="flex items-center px-6 py-2">
          <div className="grow">
            <h2 className="m-0 truncate text-title">
              {title || t('transactions')}
            </h2>
          </div>

          <Tooltip title={t('close')}>
            <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
          </Tooltip>
        </div>

        <TransactionList
          transactionIds={ids}
          initialQuery={initialQuery}
          initialDate={initialDate}
          onTrOpen={showTransaction}
          className="grow"
        />
      </div>
    </SideDrawer>
  )
}
