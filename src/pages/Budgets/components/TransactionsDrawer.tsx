import React, { FC, useEffect, useState } from 'react'
import { TEnvelopeId } from 'shared/types'
import { useSearchParam } from 'shared/hooks/useSearchParam'
import { TransactionsDrawer } from 'components/TransactionsDrawer'
import { useMonthTotals } from 'models/envelopeData'
import { useMonth } from '../model'

export const BudgetTransactionsDrawer: FC = () => {
  const [month] = useMonth()
  const [id, setId] = useSearchParam<TEnvelopeId>('transactions')
  const [savedId, setSavedId] = useState(id)
  const totals = useMonthTotals(month)
  const onClose = () => setId(undefined)

  useEffect(() => {
    if (id) setSavedId(id)
  }, [setSavedId, id])

  if (!savedId) return <TransactionsDrawer open={false} onClose={onClose} />

  const envelope = totals.envelopes[savedId]

  const trList = envelope.children.reduce((acc, childId) => {
    return acc.concat(totals.envelopes[childId].transactions)
  }, envelope.transactions)

  return (
    <TransactionsDrawer transactions={trList} open={!!id} onClose={onClose} />
  )
}
