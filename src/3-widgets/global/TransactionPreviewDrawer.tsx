import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SideDrawer } from '6-shared/ui/SideDrawer'
import { useBreakpointDown } from '6-shared/hooks/useBreakpointDown'
import { defineScreen } from '6-shared/overlays'
import type { TTransactionId } from '6-shared/types'
import { TransactionPreview } from '../transaction/TransactionPreview'

/** A screen: one transaction, described by its id alone, so Back, Forward and
 * a reload all bring it back.
 *
 * Opening the next transaction from inside it names this same screen, which
 * hands over rather than stacks — ten transactions later Back is still one
 * press away from the page. */
export const transactionScreen = defineScreen<TTransactionId>('transaction')

export const useTransactionPreview = () => transactionScreen.useOpen()

/** The transactions page lays this same screen out as a column of its own at
 * desktop width, so the drawer steps aside there rather than covering it. */
function useDockedElsewhere() {
  const isNarrow = useBreakpointDown('md')
  const { pathname } = useLocation()
  return !isNarrow && pathname.startsWith('/transactions')
}

export const TransactionPreviewDrawer = () => {
  const { t } = useTranslation('common')
  const [id, setId] = transactionScreen.use()
  const openOther = transactionScreen.useOpen()
  const onClose = useCallback(() => setId(null), [setId])
  const docked = useDockedElsewhere()

  if (docked) return null

  return (
    <SideDrawer
      onClose={onClose}
      open={!!id}
      // Full-width on phones, fixed-width from the small breakpoint.
      className="w-screen sm:w-[360px]"
      aria-label={t('transaction')}
    >
      <div className="flex h-screen min-w-80 flex-col">
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
