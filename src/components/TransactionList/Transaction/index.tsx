import React, { FC, useCallback } from 'react'
import { useSearchParam } from 'helpers/useSearchParam'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { getTransactions } from 'store/localData/transactions'
import { getType } from 'store/localData/transactions/helpers'
import { getDebtAccountId } from 'store/localData/accounts'
import { Transaction } from './Transaction'

export type WrapperProps = {
  id: string
  isChecked: boolean
  isInSelectionMode: boolean
  onToggle: (id: string) => void
  onSelectChanged: (date: number) => void
  onFilterByPayee: (date: string) => void
}

const TransactionWrapper: FC<WrapperProps> = props => {
  const {
    id,
    isInSelectionMode,
    isChecked,
    onToggle,
    onFilterByPayee,
    onSelectChanged,
  } = props
  const [opened, setOpened] = useSearchParam('transaction')
  const isOpened = opened === id
  const transaction = useSelector(
    (state: RootState) => getTransactions(state)[id]
  )
  const debtId = useSelector(getDebtAccountId)
  const type = getType(transaction, debtId)
  const onClick = useCallback(() => setOpened(id), [id, setOpened])

  return (
    <Transaction
      {...{
        // Data
        id,
        transaction,
        type,
        isInSelectionMode,
        isChecked,
        isOpened,
        // Actions
        onClick,
        onToggle,
        onFilterByPayee,
        onSelectChanged,
      }}
    />
  )
}

export default TransactionWrapper
