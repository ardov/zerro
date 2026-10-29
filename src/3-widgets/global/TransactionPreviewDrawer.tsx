import { useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { AdaptivePanel } from '@/6-shared/ui/layout/AdaptivePanel'
import { defineScreen } from '@/6-shared/overlays'
import type { TTransactionId } from '@/6-shared/types'
import {
  TransactionPreview,
  TrEmptyState,
} from '../transaction/TransactionPreview'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'
import { usePendingEdit } from '../transaction/TransactionPreview/usePendingEdit'
import { useOpenCounterpartyTransactions } from './TransactionListDrawer'

/** A screen: one transaction, described by its id alone, so Back, Forward and
 * a reload all bring it back.
 *
 * Opening the next transaction from inside it names this same screen, which
 * hands over rather than stacks — ten transactions later Back is still one
 * press away from the page. */
export const transactionScreen = defineScreen<TTransactionId>('transaction')

/** A preview opened from a modal list keeps its own history entry and never
 * takes over the page's selected transaction. */
const modalTransactionScreen = defineScreen<TTransactionId>('modalTransaction')

/** How long the screen waits before closing over a transaction that is no
 * longer in the replica.
 *
 * Missing is not always gone. Changing a transaction's creation time recreates
 * it: the original is purged and the replacement is named in the same breath,
 * but the name is part of the address, and an address change is a React
 * transition that lands a beat after the replica has already moved. Closing
 * the moment the replica moves would race that transition and lose the
 * transaction the person just edited.
 *
 * So the close waits for the address to settle, and the effect's cleanup takes
 * it back as soon as the address names something that exists. The wait costs
 * nothing to look at: deleting from inside the screen marks the transaction
 * deleted rather than removing it, so this window is only ever the handover
 * and a sync taking a transaction away underneath it. */
const HANDOVER_MS = 250

export function useTransactionPreview({ modal = false } = {}) {
  return (modal ? modalTransactionScreen : transactionScreen).useOpen()
}

/** True once the address names a transaction the replica no longer holds. */
function useTransactionGone(id: string | undefined) {
  const transactions = useAppSelector(core.transactions.selectAll)
  return !!id && !transactions[id]
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
  const pending = usePendingEdit()
  const openCounterparty = useOpenCounterpartyTransactions()
  const [id, setId] = screen.use(pending.finish)
  const openOther = screen.useOpen()
  const remove = screen.useRemove()
  const onClose = useCallback(() => setId(null), [setId])
  const gone = useTransactionGone(id)
  const shownId = useCachedValue(id, !!id)
  const currentId = docked ? id : shownId

  // Deleting the transaction from inside this screen, or a sync taking it
  // away, leaves the address naming something that no longer exists. It closes
  // itself rather than sitting there empty — telling a person the thing they
  // just deleted is missing would be no kindness.
  //
  // A transaction can also be missing for a tick without being gone: changing
  // the time of one recreates it, which purges the original and names the
  // replacement, and the two land in separate renders. So this waits for the
  // next one — the cleanup takes the close back as soon as the address names
  // something that exists.
  useEffect(() => {
    if (!gone) return
    const timer = setTimeout(remove, HANDOVER_MS)
    return () => clearTimeout(timer)
  }, [gone, remove])

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
      docked={docked}
      controller={controller}
      contentClassName="flex min-h-full flex-col"
      label={t('transaction')}
    >
      {content}
    </AdaptivePanel>
  ) : (
    <DrawerSurface
      controller={controller}
      contentClassName="flex min-h-full flex-col p-0"
      label={t('transaction')}
    >
      {content}
    </DrawerSurface>
  )
}
