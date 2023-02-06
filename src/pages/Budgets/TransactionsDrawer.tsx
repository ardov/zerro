import React, { FC, useCallback, useMemo } from 'react'
import { TISOMonth, TTransaction } from '@shared/types'
import { useSearchParam } from '@shared/hooks/useSearchParam'
import { useMonth } from '@shared/hooks/useMonth'
import { TransactionsDrawer } from '@components/TransactionsDrawer'
import { useCachedValue } from '@shared/hooks/useCachedValue'
import { envelopeModel, TEnvelopeId } from '@entities/envelope'
import { balances } from '@entities/envBalances'

/** Filter mode for transactions in balance */
export enum TrMode {
  /** Income not assigned to envelope */
  GeneralIncome = 'generalIncome',
  /** Transactions assigned to envelope (default) */
  Envelope = 'envelope',
  /** All income */
  Income = 'income',
  /** All outcome */
  Outcome = 'outcome',
  /** All transactions */
  All = 'All',
}

type TConditions = {
  id: TEnvelopeId | 'transferFees' | null
  month: TISOMonth
  mode?: TrMode
  isExact?: boolean
}

export const BudgetTransactionsDrawer: FC = () => {
  const { params, setDrawer } = useTrDrawer()
  const isOpened = !!params.id

  const cached = useCachedValue(params, isOpened)
  const onClose = () => setDrawer(null)

  const transactions = useFilteredTransactions(cached)

  if (!transactions)
    return <TransactionsDrawer open={false} onClose={onClose} />

  return (
    <TransactionsDrawer
      transactions={transactions}
      open={isOpened}
      onClose={onClose}
    />
  )
}

export function useTrDrawer() {
  const [month] = useMonth()
  const [id, setId] =
    useSearchParam<TEnvelopeId | 'transferFees'>('tr_envelope')
  const [mode, setMode] = useSearchParam<TrMode>('tr_mode')
  const [isExact, setIsExact] = useSearchParam<'true'>('tr_exact')

  const setDrawer = useCallback(
    (conditions: TConditions | null) => {
      if (!conditions) {
        setId()
        setMode()
        setIsExact()
      } else {
        setId(conditions.id)
        setMode(conditions?.mode)
        setIsExact(conditions.isExact ? 'true' : undefined)
      }
    },
    [setId, setMode, setIsExact]
  )

  const params: TConditions = useMemo(
    () => ({
      id,
      month,
      mode: mode || TrMode.Envelope,
      isExact: !!isExact,
    }),
    [id, month, mode, isExact]
  )

  return { params, setDrawer }
}

function useFilteredTransactions(conditions: TConditions): TTransaction[] {
  const { id, month, mode, isExact } = conditions
  const envelopes = envelopeModel.useEnvelopes()
  const activity = balances.useActivity()[month]
  const rawActivity = balances.useRawActivity()[month]
  if (!activity || !rawActivity || !id) return []

  // Return transfer fees
  if (id === 'transferFees') return activity.transferFees.transactions

  // Prepare ids to get transactions
  const ids = id ? (isExact ? [id] : [id, ...envelopes[id].children]) : []

  // Prepare and merge transactions
  const transactions = ids
    .map(id => {
      if (mode === TrMode.GeneralIncome)
        return activity?.generalIncome.byEnv[id]?.transactions || []
      if (mode === TrMode.Envelope)
        return activity?.envActivity.byEnv[id]?.transactions || []
      if (mode === TrMode.Income)
        return rawActivity?.income[id]?.transactions || []
      if (mode === TrMode.Outcome)
        return rawActivity?.outcome[id]?.transactions || []
      // All
      return [
        ...(rawActivity?.income[id]?.transactions || []),
        ...(rawActivity?.outcome[id]?.transactions || []),
      ]
    })
    .reduce((acc, arr) => acc.concat(arr), [])
  return transactions
}

/*
Which transaction filters do I need?

  - Envelope drawer

    - all transactions affecting envelope balance
      activity.envActivity.byEnv[id]

  - Incomes widget

    - if not keeping income => only general income
    activity.generalIncome.byEnv[id]

    - if keeping income => usual env transaction
    activity.envActivity.byEnv[id]

  - Outcomes widget

    - all transactions affecting envelope balance
      activity.envActivity.byEnv[id]

  - Transfers & debts widget

    - Envelope transactions + general income transactions
      activity.generalIncome.byEnv[id] + activity.envActivity.byEnv[id]

    - Transfer fees
      activity.transferFees

*/
