import React, { FC, useCallback, useMemo } from 'react'
import { TEnvelopeId } from '@shared/types'
import { useSearchParam } from '@shared/hooks/useSearchParam'
import { TransactionsDrawer } from '@components/TransactionsDrawer'
import { getTotalChanges } from '@entities/envelopeData'
import { useMonth } from '../model'
import { useCachedValue } from '@shared/hooks/useCachedValue'
import { useAppSelector } from '@store/index'
import { getEnvelopes } from '@entities/envelope'

export const BudgetTransactionsDrawer: FC = () => {
  const { params, setDrawer } = useTrDrawer()
  const isOpened = !!params.id

  const cached = useCachedValue(params, isOpened)
  const onClose = () => setDrawer(null)

  const envelopes = useAppSelector(getEnvelopes)
  const changesById = useAppSelector(getTotalChanges)[cached.month].byEnvelope

  const ids = cached.id
    ? cached.isExact
      ? [cached.id]
      : [cached.id, ...envelopes[cached.id].children]
    : []

  let transactions = ids
    .map(id => {
      if (cached.mode === trMode.income) return changesById[id]?.trIncome || []
      if (cached.mode === trMode.outcome)
        return changesById[id]?.trOutcome || []
      return changesById[id]?.trAll || []
    })
    .reduce((acc, arr) => acc.concat(arr), [])

  if (!cached.id) return <TransactionsDrawer open={false} onClose={onClose} />

  return (
    <TransactionsDrawer
      transactions={transactions}
      open={isOpened}
      onClose={onClose}
    />
  )
}

export enum trMode {
  all = 'all',
  income = 'income',
  outcome = 'outcome',
}

export function useTrDrawer() {
  const [month] = useMonth()
  const [id, setId] = useSearchParam<TEnvelopeId>('tr_envelope')
  const [mode, setMode] = useSearchParam<trMode>('tr_mode')
  const [isExact, setIsExact] = useSearchParam<'true'>('tr_exact')

  const setDrawer = useCallback(
    (id: TEnvelopeId | null, opts?: { mode?: trMode; isExact?: boolean }) => {
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
      mode: mode || trMode.all,
      isExact: !!isExact,
    }),
    [id, month, mode, isExact]
  )

  return { params, setDrawer }
}
