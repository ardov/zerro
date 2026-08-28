import type { FC, CSSProperties } from 'react'
import { useState, useCallback } from 'react'
import { TransactionList } from '3-widgets/transaction/TransactionList'
import { useBreakpointDown } from '6-shared/hooks/useBreakpointDown'
import type { SideDrawerProps } from '6-shared/ui/SideDrawer'
import { SideDrawer } from '6-shared/ui/SideDrawer'
import {
  TrEmptyState,
  TransactionPreview,
} from '3-widgets/transaction/TransactionPreview'
import { registerPopover } from '6-shared/historyPopovers'
import type { TTransaction, TTransactionId } from '6-shared/types'
import { track } from '6-shared/analytics'
import { useTranslation } from 'react-i18next'

import { useTransactionsPageView } from './useTransactionsPageView'

const sideWidth = 360

export default function TransactionsView() {
  const { t } = useTranslation('transactions')
  const isMobile = useBreakpointDown('md')
  const [checkedDate, setCheckedDate] = useState<Date | null>(null)
  const { open } = trPreview.useMethods()
  const view = useTransactionsPageView()
  const openedProps = trPreview.useProps()
  const opened = openedProps.displayProps.open && openedProps.extraProps.id

  const handleTrOpen = useCallback(
    (id: TTransactionId) => {
      track('transaction_details_viewed', { source: 'transactions_page' })
      open({
        id,
        onSelectSimilar: changed => setCheckedDate(new Date(changed)),
      })
    },
    [open]
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
              opened={opened || undefined}
            />
          </div>
        </div>

        {isMobile ? (
          <SideContent width={sideWidth} />
        ) : (
          <div className="w-[360px] shrink-0 overflow-auto bg-card">
            <SideContent width={sideWidth} docked />
          </div>
        )}
      </div>
    </>
  )
}

const trPreview = registerPopover<
  {
    id?: TTransactionId
    onSelectSimilar?: (changed: TTransaction['changed']) => void
  },
  SideDrawerProps
>('transactionPreview', {})

const SideContent: FC<{ docked?: boolean; width: number }> = ({
  docked,
  width,
}) => {
  const { displayProps, extraProps, open } = trPreview.useProps()
  const { id, onSelectSimilar } = extraProps
  const isXS = useBreakpointDown('sm')

  const openAnother = (id: TTransactionId) => {
    open({ id, onSelectSimilar })
  }

  const drawerContent = id ? (
    <TransactionPreview
      id={extraProps.id || ''}
      key={extraProps.id}
      onClose={displayProps.onClose}
      onOpenOther={openAnother}
      onSelectSimilar={onSelectSimilar}
    />
  ) : (
    <TrEmptyState />
  )

  if (docked) {
    return displayProps.open ? drawerContent : <TrEmptyState />
  }

  return (
    <SideDrawer {...displayProps}>
      <div
        className="w-screen sm:w-[var(--transaction-side-width)]"
        style={
          {
            '--transaction-side-width': `${isXS ? '100vw' : `${width}px`}`,
          } as CSSProperties
        }
      >
        {drawerContent}
      </div>
    </SideDrawer>
  )
}
