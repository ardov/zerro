import { IconButton } from '@/6-shared/ui/Button'
import type { TISOMonth } from '@/6-shared/types'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SideDrawer } from '@/6-shared/ui/SideDrawer'
import { Tooltip } from '@/6-shared/ui/Tooltip'
import { CloseIcon } from '@/6-shared/ui/Icons'
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
  const { title, envelopeConditions, initialDate } = value ?? {}

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
          initialQuery={initialQuery}
          initialDate={initialDate}
          onTrOpen={showTransaction}
          className="grow"
        />
      </div>
    </SideDrawer>
  )
}
