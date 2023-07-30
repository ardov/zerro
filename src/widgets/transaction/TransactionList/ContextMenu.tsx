import React, { FC, useCallback } from 'react'
import { Menu, MenuItem, MenuProps } from '@mui/material'
import { TTransaction, TTransactionId } from '@shared/types'
import { useAppDispatch } from '@store'
import { registerPopover } from '@shared/historyPopovers'
import { trModel } from '@entities/transaction'

type TTrMenuProps = {
  id: TTransactionId
  onSelectSimilar: (changed: TTransaction['changed']) => void
}

const trContext = registerPopover<TTrMenuProps, MenuProps>(
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

  const handleSelectSimilar = useCallback(() => {
    displayProps.onClose()
    onSelectSimilar(transaction.changed)
  }, [displayProps, onSelectSimilar, transaction.changed])

  return (
    <Menu {...displayProps}>
      <MenuItem onClick={handleSelectSimilar}>
        Выбрать изменённые в это же время
      </MenuItem>
    </Menu>
  )
}
