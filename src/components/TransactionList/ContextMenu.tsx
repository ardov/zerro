import React, { FC, useCallback } from 'react'
import { Menu, MenuItem, MenuProps } from '@mui/material'
import { TTransaction, TTransactionId } from '@shared/types'
import { useAppDispatch } from '@store'
import { trModel } from '@entities/transaction'
import { makePopoverHooks } from '@shared/ui/PopoverManager'

type TTrMenuProps = {
  id: TTransactionId
  onSelectSimilar: (changed: TTransaction['changed']) => void
}

const trContext = makePopoverHooks<TTrMenuProps, MenuProps>(
  'transactionContext',
  { id: '', onSelectSimilar: () => {} }
)

export const useTrContextMenu = (
  onSelectSimilar: TTrMenuProps['onSelectSimilar']
) => {
  const { open } = trContext.useMethods()
  return useCallback(
    (id: TTransactionId) => (event: React.MouseEvent) => {
      event.preventDefault()
      open(
        { id, onSelectSimilar },
        {
          anchorReference: 'anchorPosition',
          anchorPosition: { left: event.clientX - 2, top: event.clientY - 4 },
        }
      )
    },
    [onSelectSimilar, open]
  )
}

export const TransactionMenu: FC = () => {
  const { displayProps, extraProps } = trContext.useProps()
  const { id, onSelectSimilar } = extraProps
  const dispatch = useAppDispatch()
  const transaction = trModel.useTransactions()[id]

  return (
    <Menu {...displayProps}>
      <MenuItem
        onClick={e => {
          displayProps.onClose()
          onSelectSimilar(transaction.changed)
        }}
      >
        Выбрать изменённые в это же время
      </MenuItem>
    </Menu>
  )
}
