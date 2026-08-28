import type { TAccountId } from '6-shared/types'
import type { FC } from 'react'
import { useCallback } from 'react'
import type { MenuProps } from '6-shared/ui/Menu'
import { Menu, MenuItem } from '6-shared/ui/Menu'
import { useAppDispatch } from 'store'
import { registerPopover } from '6-shared/historyPopovers'
import { track } from '6-shared/analytics'
import { useTranslation } from 'react-i18next'
import { core } from 'zerro-core/redux'

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
      anchorPosition: { left: number; top: number }
    ) => {
      open(props, { anchorPosition })
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
  const account = core.accounts.useAll()[id]

  if (!account) return null

  const options = [
    {
      label: t('moveFromBalance'),
      condition: account.inBalance,
      action: () => {
        dispatch(core.accounts.setInBalance(id, false))
        track('account_budget_membership_changed', {
          in_budget: false,
          source: 'context_menu',
        })
      },
    },
    {
      label: t('moveInBalance'),
      condition: !account.inBalance,
      action: () => {
        dispatch(core.accounts.setInBalance(id, true))
        track('account_budget_membership_changed', {
          in_budget: true,
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
