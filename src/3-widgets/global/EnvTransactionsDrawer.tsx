import type { TISOMonth } from '@/6-shared/types'
import { useCallback } from 'react'
import type { core } from '@/zerro-core/redux'
import type { TTransactionListProps } from '../transaction/TransactionList'
import {
  envelopeTransactionsValue,
  useTransactionDrawer,
} from './TransactionListDrawer'

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
    (props: EnvTransactionsDrawerProps) =>
      openList(envelopeTransactionsValue(props)),
    [openList]
  )
}
