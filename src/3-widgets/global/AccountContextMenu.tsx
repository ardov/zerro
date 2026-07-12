import type { TAccountId } from '6-shared/types'
import React, { FC, useCallback } from 'react'
import { Menu, MenuItem, MenuProps } from '@mui/material'
import { useAppDispatch } from 'store'
import { registerPopover } from '6-shared/historyPopovers'
import { sendEvent } from '6-shared/helpers/tracking'
import { useTranslation } from 'react-i18next'
import { setAccountInBalance, useCoreAccounts } from 'zerro-core/redux'
import { getMenuPosition } from './shared/helpers'

type AccountMenuProps = { id: TAccountId }

const accContext = registerPopover<AccountMenuProps, MenuProps>(
  'accountContextMenu',
  { id: '' }
)

export const useAccountContextMenu = () => {
  const { open } = accContext.useMethods()
  const openMenu = useCallback(
    (
      props: AccountMenuProps,
      anchorPosition?: { left: number; top: number }
    ) => {
      open(props, getMenuPosition(anchorPosition))
    },
    [open]
  )
  return openMenu
}

export const AccountContextMenu: FC = () => {
  const { t } = useTranslation('accountContextMenu')
  const { displayProps, extraProps } = accContext.useProps()
  const { id } = extraProps
  const dispatch = useAppDispatch()
  const account = useCoreAccounts()[id]

  if (!account) return null

  const options = [
    {
      label: t('moveFromBalance'),
      condition: account.inBalance,
      action: () => {
        sendEvent('Accounts: Set in budget')
        dispatch(setAccountInBalance(id, false))
      },
    },
    {
      label: t('moveInBalance'),
      condition: !account.inBalance,
      action: () => {
        sendEvent('Accounts: Set in budget')
        dispatch(setAccountInBalance(id, true))
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
