import React, { FC, useState } from 'react'
import { Menu, MenuItem, MenuProps, PopoverPosition } from '@mui/material'
import { Transaction } from 'types'
import { isNew } from 'store/data/transactions/helpers'
import { useDispatch } from 'react-redux'
import { markViewed } from 'store/data/transactions/thunks'

interface TransactionMenuProps extends MenuProps {
  id: string
  transaction: Transaction
  onSelectChanged: (date: number) => void
}

export const TransactionMenu: FC<TransactionMenuProps> = ({
  id,
  transaction,
  onSelectChanged,
  ...rest
}) => {
  const dispatch = useDispatch()
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
          dispatch(markViewed(id, isNew(transaction)))
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
