import type { TISOMonth } from '@/6-shared/types'
import { useCallback } from 'react'
import { core } from '@/zerro-core/redux'
import type { TTransactionListProps } from '../transaction/TransactionList'
import { useTransactionDrawer } from './TransactionListDrawer'

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

/** Envelope activity uses the same independently owned transaction list. */
export function useEnvTransactionsDrawer() {
  const openList = useTransactionDrawer()
  return useCallback(
    ({ envelopeConditions, ...props }: EnvTransactionsDrawerProps) => {
      const {
        id,
        month,
        isExact,
        mode = core.transactions.TrFilterMode.Envelope,
      } = envelopeConditions
      return openList({
        ...props,
        initialQuery: {
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
        },
      })
    },
    [openList]
  )
}
