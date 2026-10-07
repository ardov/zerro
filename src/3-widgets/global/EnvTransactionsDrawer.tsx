import type { TISOMonth } from '@/6-shared/types'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DrawerSurface } from '@/6-shared/ui/kit/Drawer'
import { useCachedValue } from '@/6-shared/hooks/useCachedValue'
import { defineScreen } from '@/6-shared/overlays'
import { core } from '@/zerro-core/redux'

import type { TTransactionListProps } from '../transaction/TransactionList'
import { TransactionList } from '../transaction/TransactionList'
import { useTransactionPreview } from './TransactionPreviewDrawer'

type TEnvConditions = {
  month: TISOMonth
  id: core.envelopes.TEnvelopeId | 'transferFees' | null
  isExact?: boolean
  mode?: core.transactions.TrFilterMode
}

export type EnvTransactionsDrawerProps = {
  title?: string
  initialDate?: TTransactionListProps['initialDate']
  envelopeConditions: TEnvConditions
}

/** A screen: everything it shows is described by the conditions it was opened
 * with, and those are plain data already. */
const envelopeTransactionsScreen = defineScreen<EnvTransactionsDrawerProps>(
  'envelopeTransactions'
)

export const useEnvTransactionsDrawer = () =>
  envelopeTransactionsScreen.useOpen()

export const EnvTransactionsDrawer = () => {
  const { t } = useTranslation('common')
  const [value, setValue] = envelopeTransactionsScreen.use()
  const showTransaction = useTransactionPreview()
  const onClose = useCallback(() => setValue(null), [setValue])
  // The screen value is gone while the drawer slides out. Keep showing what
  // it showed, so the closing list keeps its title and its filter.
  const shown = useCachedValue(value, !!value)
  const { title, envelopeConditions, initialDate } = shown ?? {}

  const initialQuery = useMemo<core.transactions.TTransactionQuery>(() => {
    if (!envelopeConditions) return { clauses: [] }

    const {
      id,
      month,
      isExact,
      mode = core.transactions.TrFilterMode.Envelope,
    } = envelopeConditions
    return {
      clauses: [
        {
          kind: 'activity',
          envelopeIds: id === 'transferFees' || id === null ? [] : [id],
          scope: isExact ? 'self' : 'tree',
          mode:
            id === 'transferFees'
              ? core.transactions.TrFilterMode.TransferFees
              : mode,
          month,
        },
      ],
    }
  }, [envelopeConditions])

  return (
    <DrawerSurface
      title={title || t('transactions')}
      controller={{ open: !!value, setOpen: open => !open && onClose() }}
      contentScrolls
    >
      <TransactionList
        initialQuery={initialQuery}
        initialDate={initialDate}
        onTrOpen={showTransaction}
        className="grow"
      />
    </DrawerSurface>
  )
}
