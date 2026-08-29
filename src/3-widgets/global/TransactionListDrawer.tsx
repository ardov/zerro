import { IconButton } from '6-shared/ui/Button'
import type { TTransaction } from '6-shared/types'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SideDrawer } from '6-shared/ui/SideDrawer'
import { Tooltip } from '6-shared/ui/Tooltip'
import { CloseIcon } from '6-shared/ui/Icons'
import { registerPopover } from '6-shared/historyPopovers'
import type { core } from 'zerro-core/redux'

import type { TTransactionListProps } from '../transaction/TransactionList'
import { TransactionList } from '../transaction/TransactionList'
import { useTransactionPreview } from './TransactionPreviewDrawer'

export type TransactionDrawerProps = {
  title?: string
  transactions?: TTransaction[]
  initialQuery?: core.transactions.TTransactionQuery
  initialDate?: TTransactionListProps['initialDate']
}

const trDrawerHooks = registerPopover(
  'transaction-list-drawer',
  {} as TransactionDrawerProps
)

export const useTransactionDrawer = trDrawerHooks.useMethods

export const SmartTransactionListDrawer = () => {
  const { t } = useTranslation('common')
  const drawer = trDrawerHooks.useProps()
  const trPreview = useTransactionPreview()
  const { title, transactions, initialQuery, initialDate } = drawer.extraProps
  const { onClose, open } = drawer.displayProps

  const showTransaction = useCallback(
    function show(id: string) {
      trPreview.open({
        id,
        onOpenOther: (id: string) => {
          trPreview.close()
          show(id)
        },
        onSelectSimilar: () => {
          // TODO: implement
        },
      })
    },
    [trPreview]
  )

  return (
    <SideDrawer
      onClose={onClose}
      open={open}
      // MUI sized the paper through `sx`; the sheet takes it as a class.
      className="w-screen sm:w-[360px]"
      aria-label={title || t('transactions')}
    >
      <div className="flex h-screen min-w-80 flex-col">
        <div className="flex items-center px-6 py-2">
          <div className="grow">
            <h2 className="m-0 truncate type-title">
              {title || t('transactions')}
            </h2>
          </div>

          <Tooltip title={t('close')}>
            <IconButton edge="end" onClick={onClose} children={<CloseIcon />} />
          </Tooltip>
        </div>

        <TransactionList
          transactionIds={transactions?.map(transaction => transaction.id)}
          initialQuery={initialQuery}
          initialDate={initialDate}
          onTrOpen={showTransaction}
          className="grow"
        />
      </div>
    </SideDrawer>
  )
}
