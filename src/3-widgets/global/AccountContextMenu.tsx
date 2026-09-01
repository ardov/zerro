import type { TAccountId } from '@/6-shared/types'
import type { FC } from 'react'
import { Menu, MenuItem } from '@/6-shared/ui/Menu'
import { useAppDispatch } from '@/store'
import { useAsked } from '@/6-shared/overlays'
import { track } from '@/6-shared/analytics'
import { useTranslation } from 'react-i18next'
import { core } from '@/zerro-core/redux'

export type AccountMenuProps = {
  id: TAccountId
  anchorPosition?: { left: number; top: number }
}

/** The account's context menu. Every item acts on the account itself, so it
 * answers nothing — the answer is the account being changed. */
export const AccountMenu: FC<AccountMenuProps> = ({ id, anchorPosition }) => {
  const { t } = useTranslation('accountContextMenu')
  const { open, answer } = useAsked<void>()
  const dispatch = useAppDispatch()
  const account = core.accounts.useAll()[id]

  const options = account
    ? [
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
    : []

  return (
    <Menu open={open} onClose={() => answer()} anchorPosition={anchorPosition}>
      {options
        .filter(({ condition }) => condition)
        .map(({ label, action }) => (
          <MenuItem
            key={label}
            onClick={() => {
              answer()
              action()
            }}
          >
            {label}
          </MenuItem>
        ))}
    </Menu>
  )
}
