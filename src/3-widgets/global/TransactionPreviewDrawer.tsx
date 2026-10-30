import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { AdaptivePanel } from '@/6-shared/ui/layout/AdaptivePanel'
import { defineScreen, useIsTopScreen } from '@/6-shared/overlays'
import type { TTransactionId } from '@/6-shared/types'
import {
  TransactionPreview,
  TrEmptyState,
} from '../transaction/TransactionPreview'
import { useTransactionHandover } from '../transaction/TransactionPreview/useTransactionHandover'
import { usePendingEdit } from '../transaction/TransactionPreview/usePendingEdit'
import { useOpenCounterpartyTransactions } from './TransactionListDrawer'

/** A screen: one transaction, described by its id alone, so Back, Forward and
 * a reload all bring it back.
 *
 * Opening the next transaction from inside it names this same screen, which
 * hands over rather than stacks — ten transactions later Back is still one
 * press away from the page. */
export const transactionScreen = defineScreen<TTransactionId>('transaction')

/** Read saved previews from before lists owned their own Details instance. */
const modalTransactionScreen = defineScreen<TTransactionId>('modalTransaction')

export function useTransactionPreview() {
  return transactionScreen.useOpen()
}

/** The transactions page owns its persistent adaptive editor. Other pages
 * open the same URL-backed screen in a modal. */
export const TransactionPreviewDrawer = () => {
  const { pathname } = useLocation()
  return (
    <>
      {!pathname.startsWith('/transactions') && (
        <TransactionScreenDrawer screen={transactionScreen} />
      )}
      <TransactionScreenDrawer screen={modalTransactionScreen} />
    </>
  )
}

export function TransactionScreenPanel({
  docked,
  onSelectSimilar,
}: {
  docked: boolean
  onSelectSimilar?: (date: number) => void
}) {
  return (
    <TransactionScreenDrawer
      screen={transactionScreen}
      docked={docked}
      adaptive
      onSelectSimilar={onSelectSimilar}
    />
  )
}

function TransactionScreenDrawer({
  screen,
  docked = false,
  adaptive = false,
  onSelectSimilar,
}: {
  screen: typeof transactionScreen
  docked?: boolean
  adaptive?: boolean
  onSelectSimilar?: (date: number) => void
}) {
  const { t } = useTranslation('common')
  const active = useIsTopScreen(screen.name)
  const pending = usePendingEdit()
  const openCounterparty = useOpenCounterpartyTransactions()
  const [id, setId] = screen.use(pending.finish)
  const openOther = screen.useOpen()
  const remove = screen.useRemove()
  const onClose = useCallback(() => setId(null), [setId])
  const shownId = useTransactionHandover(id, remove)
  const currentId = docked ? id : shownId

  const controller = {
    open: !!id,
    setOpen: (open: boolean) => {
      if (!open) onClose()
    },
  }
  const content = currentId ? (
    <TransactionPreview
      id={currentId}
      onClose={onClose}
      onPendingEdit={pending.register}
      onOpenOther={openOther}
      onSelectSimilar={onSelectSimilar}
      onOpenCounterparty={openCounterparty}
    />
  ) : (
    <TrEmptyState />
  )

  return adaptive ? (
    <AdaptivePanel
      active={active}
      docked={docked}
      controller={controller}
      contentClassName="flex min-h-full flex-col"
      label={t('transaction')}
    >
      {content}
    </AdaptivePanel>
  ) : (
    <DrawerSurface
      active={active}
      controller={controller}
      contentClassName="flex min-h-full flex-col p-0"
      label={t('transaction')}
    >
      {content}
    </DrawerSurface>
  )
}
