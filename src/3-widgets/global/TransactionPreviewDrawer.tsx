import { useCallback, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { AdaptivePanel } from '@/6-shared/ui/layout/AdaptivePanel'
import { defineScreen, useIsTopScreen } from '@/6-shared/overlays'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'
import type { TTransactionId } from '@/6-shared/types'
import {
  TransactionPreview,
  TrEmptyState,
} from '../transaction/TransactionPreview'
import { useTransactionHandover } from '../transaction/TransactionPreview/useTransactionHandover'
import { usePendingEdit } from '../transaction/TransactionPreview/usePendingEdit'
import { useOpenRelatedTransactions } from './TransactionListDrawer'

/** Opening another transaction in the same screen replaces its entry, so Back still returns to the page. */
export const transactionScreen = defineScreen<TTransactionId>('transaction')

/** Read saved previews from before lists owned their own Details instance. */
const modalTransactionScreen = defineScreen<TTransactionId>('modalTransaction')

export const transactionSummaryScreen = defineScreen<true>('transactionSummary')

type SummarySlot = (onClose?: () => void) => ReactNode

export function useTransactionPreview() {
  return transactionScreen.useOpen()
}

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
  summary,
  summaryByDefault,
}: {
  docked: boolean
  summary?: SummarySlot
  summaryByDefault?: boolean
}) {
  return (
    <TransactionScreenDrawer
      screen={transactionScreen}
      docked={docked}
      adaptive
      summary={summary}
      summaryByDefault={summaryByDefault}
    />
  )
}

function TransactionScreenDrawer({
  screen,
  docked = false,
  adaptive = false,
  summary,
  summaryByDefault = false,
}: {
  screen: typeof transactionScreen
  docked?: boolean
  adaptive?: boolean
  summary?: SummarySlot
  summaryByDefault?: boolean
}) {
  const { t } = useTranslation(['common', 'transactionSummary'])
  const [summaryValue, setSummary] = transactionSummaryScreen.use()
  const summaryOpen = !!summary && !!summaryValue
  const active = useIsTopScreen(
    screen.name,
    summary ? transactionSummaryScreen.name : undefined
  )
  const pending = usePendingEdit()
  const openList = useOpenRelatedTransactions()
  const [id, setId] = screen.use(pending.finish)
  const openOther = screen.useOpen()
  const remove = screen.useRemove()
  const onClose = useCallback(
    () => (id ? setId(null) : setSummary(null)),
    [id, setId, setSummary]
  )
  const shownId = useTransactionHandover(id, remove)
  const currentId = docked ? id : shownId
  // A closing drawer keeps what it showed until it has slid out.
  const kind = id ? 'transaction' : summaryOpen ? 'summary' : null
  const shownKind = useCachedValue(kind, !!kind)
  const currentKind = docked ? kind : shownKind
  const resting = docked && summaryByDefault

  const controller = {
    open: !!kind,
    setOpen: (open: boolean) => {
      if (!open) onClose()
    },
  }
  const content =
    currentKind === 'summary' && summary ? (
      summary(resting ? undefined : onClose)
    ) : currentKind === 'transaction' && currentId ? (
      <TransactionPreview
        id={currentId}
        onClose={onClose}
        onPendingEdit={pending.register}
        onOpenOther={openOther}
        onOpenList={openList}
      />
    ) : resting && summary ? (
      summary()
    ) : (
      <TrEmptyState />
    )
  const label =
    currentKind === 'summary' || (!currentKind && resting)
      ? t('transactionSummary:title')
      : t('transaction')

  return adaptive ? (
    <AdaptivePanel
      active={active}
      docked={docked}
      controller={controller}
      contentClassName="flex min-h-full flex-col"
      label={label}
    >
      {content}
    </AdaptivePanel>
  ) : (
    <DrawerSurface
      active={active}
      controller={controller}
      contentClassName="flex min-h-full flex-col p-0"
      label={label}
    >
      {content}
    </DrawerSurface>
  )
}
