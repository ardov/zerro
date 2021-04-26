import React, { FC, useState } from 'react'
import { Menu, MenuItem, MenuProps, PopoverPosition } from '@material-ui/core'
import { Transaction } from 'types'
import { isNew } from 'store/localData/transactions/helpers'
import { useDispatch } from 'react-redux'
import { markViewed } from 'store/localData/transactions/thunks'

interface TransactionMenuProps extends MenuProps {
  id: string
  transaction: Transaction
}

export const TransactionMenu: FC<TransactionMenuProps> = ({
  id,
  transaction,
  ...rest
}) => {
  const dispatch = useDispatch()
  return (
    <Menu {...rest}>
      <MenuItem
        onClick={e => {
          dispatch(markViewed(id, isNew(transaction)))
          rest.onClose?.(e, 'escapeKeyDown')
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
