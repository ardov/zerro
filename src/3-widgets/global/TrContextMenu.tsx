import React, { FC, useCallback } from 'react'
import { Menu, MenuItem, MenuProps } from '@mui/material'
import { TTransaction, TTransactionId } from '6-shared/types'
import { useAppDispatch } from 'store'
import { registerPopover } from '6-shared/historyPopovers'
import { trModel } from '5-entities/transaction'
import { useTranslation } from 'react-i18next'

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
  const handleClick = useCallback(
    (event: React.MouseEvent | React.TouchEvent, props: TTrMenuProps) => {
      event.preventDefault()
      const getCoordinates = () => {
        if ('touches' in event) {
          const { clientX, clientY } = event.touches[0]
          return { left: clientX, top: clientY }
        }
        return { left: event.clientX, top: event.clientY }
      }
      open(props, {
        anchorReference: 'anchorPosition',
        anchorPosition: getCoordinates(),
      })
    },
    [open]
  )

  return handleClick
}

export const TrContextMenu: FC = () => {
  const { t } = useTranslation('transactionContextMenu')
  const { displayProps, extraProps } = trContext.useProps()
  const { id, onSelectSimilar, onMarkOlderViewed } = extraProps
  const dispatch = useAppDispatch()
  const transaction = trModel.useTransactions()[id]

  if (!transaction) return null

  const editable = transaction.deleted === false
  const viewed = trModel.isViewed(transaction)

  const options = [
    {
      label: t('restore'),
      condition: transaction.deleted,
      action: () => {
        dispatch(trModel.restoreTransaction(id))
      },
    },
    {
      label: t('markViewed'),
      condition: editable && !viewed,
      action: () => {
        dispatch(trModel.markViewed([id], true))
      },
    },
    {
      label: t('markUnviewed'),
      condition: editable && viewed,
      action: () => {
        dispatch(trModel.markViewed([id], false))
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
        dispatch(trModel.deleteTransactions([id]))
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
