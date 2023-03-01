import React, { FC, useCallback } from 'react'
import { useSearchParam } from '@shared/hooks/useSearchParam'
import { useAppSelector } from '@store'
import { RootState } from '@store'
import { trModel } from '@entities/transaction'
import { getType } from '@entities/transaction/helpers'
import { accountModel } from '@entities/account'
import { Transaction } from './Transaction'
import { useContextMenu, TransactionMenu } from './ContextMenu'

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
  const [onContextMenu, bind] = useContextMenu()
  const [opened, setOpened] = useSearchParam('transaction', 'push')
  const isOpened = opened === id
  const transaction = useAppSelector(
    (state: RootState) => trModel.getTransactions(state)[id]
  )
  const debtId = accountModel.useDebtAccountId()
  const type = getType(transaction, debtId)
  const onClick = useCallback(() => setOpened(id), [id, setOpened])

  return (
    <>
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
          onContextMenu,
        }}
      />
      <TransactionMenu
        id={id}
        transaction={transaction}
        onSelectChanged={onSelectChanged}
        {...bind}
      />
    </>
  )
}

export default TransactionWrapper
