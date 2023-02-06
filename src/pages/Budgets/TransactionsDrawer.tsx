import React, { FC, useCallback, useMemo } from 'react'
import { ById } from '@shared/types'
import { useSearchParam } from '@shared/hooks/useSearchParam'
import { useMonth } from '@shared/hooks/useMonth'
import { TransactionsDrawer } from '@components/TransactionsDrawer'
import { useCachedValue } from '@shared/hooks/useCachedValue'
import { envelopeModel, TEnvelope, TEnvelopeId } from '@entities/envelope'
import { balances, TActivityNode } from '@entities/envBalances'

export enum trMode {
  GeneralIncome = 'generalIncome',
  // TransferFees = 'transferFees',
  Envelope = 'envelope',
  All = 'All',
}

export const BudgetTransactionsDrawer: FC = () => {
  const { params, setDrawer } = useTrDrawer()
  const isOpened = !!params.id

  const cached = useCachedValue(params, isOpened)
  const onClose = () => setDrawer(null)

  const envelopes = envelopeModel.useEnvelopes()
  const activity = balances.useActivity()[cached.month]

  const transactions = getTransactions(
    activity,
    envelopes,
    cached.id,
    cached.mode,
    cached.isExact
  )

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
  const [mode, setMode] = useSearchParam<trMode>('tr_mode')
  const [isExact, setIsExact] = useSearchParam<'true'>('tr_exact')

  const setDrawer = useCallback(
    (
      id: TEnvelopeId | 'transferFees' | null,
      opts?: { mode?: trMode; isExact?: boolean }
    ) => {
      if (!id) {
        setId()
        setMode()
        setIsExact()
      } else {
        setId(id)
        setMode(opts?.mode)
        opts?.isExact && setIsExact('true')
      }
    },
    [setId, setMode, setIsExact]
  )

  const params = useMemo(
    () => ({
      id,
      month,
      mode: mode || trMode.Envelope,
      isExact: !!isExact,
    }),
    [id, month, mode, isExact]
  )

  return { params, setDrawer }
}

function getTransactions(
  activity: TActivityNode,
  envelopes: ById<TEnvelope>,
  id: TEnvelopeId | 'transferFees' | null,
  mode: trMode,
  isExact: boolean
) {
  if (!id) return null
  if (id === 'transferFees') return activity.transferFees.transactions

  const ids = id ? (isExact ? [id] : [id, ...envelopes[id].children]) : []
  const transactions = ids
    .map(id => {
      const income = activity?.generalIncome.byEnv[id]?.transactions || []
      const envelope = activity?.envActivity.byEnv[id]?.transactions || []
      if (mode === trMode.GeneralIncome) return income
      if (mode === trMode.Envelope) return envelope
      if (mode === trMode.All) return [...income, ...envelope]
      return []
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
