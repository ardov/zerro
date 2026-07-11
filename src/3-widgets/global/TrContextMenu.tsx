import React, { FC, useCallback } from 'react'
import { Menu, MenuItem, MenuProps } from '@mui/material'
import { TTransaction, TTransactionId } from '6-shared/types'
import { useAppDispatch, useAppSelector } from 'store'
import { registerPopover } from '6-shared/historyPopovers'
import { sendEvent } from '6-shared/helpers/tracking'
import {
  deleteTransactions,
  isTransactionViewed,
  restoreTransaction,
  selectCoreTransactions,
  setTransactionsViewed,
} from 'core-next/adapters/redux'
import { useTranslation } from 'react-i18next'
import { getMenuPosition } from './shared/helpers'

type TTrMenuProps = {
  id: TTransactionId
  onSelectSimilar?: (changed: TTransaction['changed']) => void
  onMarkOlderViewed?: (id: TTransactionId) => void
}

const trContext = registerPopover<TTrMenuProps, MenuProps>(
  'transactionContextMenu',
  { id: '' }
)

export const useTrContextMenu = () => {
  const { open } = trContext.useMethods()
  const openMenu = useCallback(
    (props: TTrMenuProps, anchorPosition?: { left: number; top: number }) => {
      open(props, getMenuPosition(anchorPosition))
    },
    [open]
  )
  return openMenu
}

export const TrContextMenu: FC = () => {
  const { t } = useTranslation('transactionContextMenu')
  const { displayProps, extraProps } = trContext.useProps()
  const { id, onSelectSimilar, onMarkOlderViewed } = extraProps
  const dispatch = useAppDispatch()
  const transaction = useAppSelector(state => selectCoreTransactions(state)[id])

  if (!transaction) return null

  const editable = transaction.deleted === false
  const viewed = isTransactionViewed(transaction)

  const options = [
    {
      label: t('restore'),
      condition: transaction.deleted,
      action: () => {
        sendEvent('Transaction: restore')
        dispatch(restoreTransaction(id))
      },
    },
    {
      label: t('markViewed'),
      condition: editable && !viewed,
      action: () => {
        sendEvent('Transaction: mark viewed: true')
        dispatch(setTransactionsViewed([id], true))
      },
    },
    {
      label: t('markUnviewed'),
      condition: editable && viewed,
      action: () => {
        sendEvent('Transaction: mark viewed: false')
        dispatch(setTransactionsViewed([id], false))
      },
    },
    {
      label: t('markViewedOlder'),
      condition: !!onMarkOlderViewed,
      action: () => {
        onMarkOlderViewed?.(id)
      },
    },
    {
      label: t('selectSimilar'),
      condition: !!onSelectSimilar,
      action: () => {
        onSelectSimilar?.(transaction.changed)
      },
    },
    {
      label: t('delete'),
      condition: !transaction.deleted,
      action: () => {
        sendEvent('Transaction: delete')
        dispatch(deleteTransactions([id]))
      },
    },
  ]

  return (
    <Menu {...displayProps}>
      {options
        .filter(({ condition }) => condition)
        .map(({ label, action }) => (
          <MenuItem
            key={label}
            onClick={() => {
              displayProps.onClose()
              action()
            }}
          >
            {label}
          </MenuItem>
        ))}
    </Menu>
  )
}
