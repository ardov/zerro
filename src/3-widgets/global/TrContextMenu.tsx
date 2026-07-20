import { FC, useCallback } from 'react'
import { Menu, MenuItem, MenuProps } from '@mui/material'
import { TTransaction, TTransactionId } from '6-shared/types'
import { useAppDispatch, useAppSelector } from 'store'
import { registerPopover } from '6-shared/historyPopovers'
import { track } from '6-shared/analytics'
import { core } from 'zerro-core/redux'

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
  const transaction = useAppSelector(
    state => core.transactions.selectAll(state)[id]
  )

  if (!transaction) return null

  const editable = transaction.deleted === false
  const viewed = core.transactions.isViewed(transaction)

  const options = [
    {
      label: t('restore'),
      condition: transaction.deleted,
      action: () => {
        dispatch(core.transactions.restore(id))
        track('transaction_restored', { source: 'context_menu' })
      },
    },
    {
      label: t('markViewed'),
      condition: editable && !viewed,
      action: () => {
        dispatch(core.transactions.setViewed([id], true))
        track('transaction_viewed_changed', {
          viewed: true,
          mode: 'single',
          source: 'context_menu',
        })
      },
    },
    {
      label: t('markUnviewed'),
      condition: editable && viewed,
      action: () => {
        dispatch(core.transactions.setViewed([id], false))
        track('transaction_viewed_changed', {
          viewed: false,
          mode: 'single',
          source: 'context_menu',
        })
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
        dispatch(core.transactions.remove([id]))
        track('transaction_deleted', {
          mode: 'single',
          source: 'context_menu',
        })
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
