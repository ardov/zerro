import React, { FC, useState } from 'react'
import { Menu, MenuItem, MenuProps, PopoverPosition } from '@mui/material'
import { TTransaction, TTransactionId } from '@shared/types'
import { isNew } from '@entities/transaction/helpers'
import { useAppDispatch } from '@store'
import { trModel } from '@entities/transaction'

interface TransactionMenuProps extends MenuProps {
  id: string
  transaction: TTransaction
  onSelectChanged: (date: number) => void
}

type TTrMenuProps = {
  left: number
  top: number
  id: TTransactionId
}

export const TransactionMenu: FC<TransactionMenuProps> = ({
  id,
  transaction,
  onSelectChanged,
  ...rest
}) => {
  const dispatch = useAppDispatch()
  const close = () => rest.onClose?.({}, 'escapeKeyDown')
  return (
    <Menu {...rest}>
      <MenuItem
        onClick={e => {
          onSelectChanged(transaction.changed)
          close()
        }}
      >
        Выбрать изменённые в это же время
      </MenuItem>
      <MenuItem
        onClick={e => {
          dispatch(trModel.markViewed(id, isNew(transaction)))
          close()
        }}
      >
        Сделать {isNew(transaction) ? 'просмотренной' : 'непросмотренной'}
      </MenuItem>
    </Menu>
  )
}

type Coords = PopoverPosition | undefined
type ClickHandler = (event: React.MouseEvent<HTMLDivElement>) => void
type Bind = {
  open: MenuProps['open']
  onClose: MenuProps['onClose']
  anchorPosition: MenuProps['anchorPosition']
  anchorReference: MenuProps['anchorReference']
}

export const useContextMenu = (initial?: Coords): [ClickHandler, Bind] => {
  const [position, setPosition] = useState<Coords>(initial)
  const onTriggerClick: ClickHandler = event => {
    event.preventDefault()
    setPosition({
      left: event.clientX - 2,
      top: event.clientY - 4,
    })
  }
  const bind: Bind = {
    open: !!position,
    onClose: () => setPosition(undefined),
    anchorReference: 'anchorPosition',
    anchorPosition: position,
  }
  return [onTriggerClick, bind]
}
