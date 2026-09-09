import { useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { SideDrawer } from '@/6-shared/ui/SideDrawer'
import { useBreakpointDown } from '@/6-shared/hooks/useBreakpointDown'
import { defineScreen } from '@/6-shared/overlays'
import type { TTransactionId } from '@/6-shared/types'
import { TransactionPreview } from '../transaction/TransactionPreview'

/** A screen: one transaction, described by its id alone, so Back, Forward and
 * a reload all bring it back.
 *
 * Opening the next transaction from inside it names this same screen, which
 * hands over rather than stacks — ten transactions later Back is still one
 * press away from the page. */
export const transactionScreen = defineScreen<TTransactionId>('transaction')

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

export const useTransactionPreview = () => transactionScreen.useOpen()

/** True once the address names a transaction the replica no longer holds. */
function useTransactionGone(id: string | undefined) {
  const transactions = useAppSelector(core.transactions.selectAll)
  return !!id && !transactions[id]
}

/** Whether this screen is being laid out as a column in the page rather than
 * drawn over it.
 *
 * One fact read from both sides: the transactions page asks it to decide
 * whether to draw its column, and the drawer asks it to decide whether to
 * stand aside. Keeping it in one place is what stops the two from disagreeing
 * and showing the transaction twice, or not at all. */
export function useTransactionScreenDocked() {
  const isNarrow = useBreakpointDown('md')
  const { pathname } = useLocation()
  return !isNarrow && pathname.startsWith('/transactions')
}

export const TransactionPreviewDrawer = () => {
  const { t } = useTranslation('common')
  const [id, setId] = transactionScreen.use()
  const openOther = transactionScreen.useOpen()
  const onClose = useCallback(() => setId(null), [setId])
  const docked = useTransactionScreenDocked()
  const gone = useTransactionGone(id)

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
    const timer = setTimeout(() => setId(null), HANDOVER_MS)
    return () => clearTimeout(timer)
  }, [gone, setId])

  if (docked) return null

  return (
    <SideDrawer
      onClose={onClose}
      open={!!id}
      // Full-width on phones, fixed-width from the small breakpoint.
      className="w-screen sm:w-[360px]"
      aria-label={t('transaction')}
    >
      <div className="flex min-h-full min-w-80 flex-col">
        {id && (
          <TransactionPreview
            id={id}
            key={id}
            onClose={onClose}
            onOpenOther={openOther}
          />
        )}
      </div>
    </SideDrawer>
  )
}
