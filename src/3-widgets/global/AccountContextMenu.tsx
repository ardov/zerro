import type { TAccountId } from '@/6-shared/types'
import type { FC } from 'react'
import { MenuSurface, type MenuSurfaceProps } from '@/6-shared/ui/kit/Menu'
import { useAppDispatch } from '@/store'
import { useAsked } from '@/6-shared/overlays'
import { track } from '@/6-shared/analytics'
import { useTranslation } from 'react-i18next'
import { core } from '@/zerro-core/redux'

export type AccountMenuProps = {
  id: TAccountId
  anchor: MenuSurfaceProps['anchor']
}

/** The account's context menu, asked from a context gesture. */
export const AccountMenu: FC<AccountMenuProps> = ({ id, anchor }) => {
  const { t } = useTranslation('accountContextMenu')
  const { controller } = useAsked<void>()
  const dispatch = useAppDispatch()
  const account = core.accounts.useAll()[id]

  const items = account
    ? [
        {
          id: 'inBalance',
          label: t(account.inBalance ? 'moveFromBalance' : 'moveInBalance'),
          onSelect: () => {
            dispatch(core.accounts.setInBalance(id, !account.inBalance))
            track('account_budget_membership_changed', {
              in_budget: !account.inBalance,
              source: 'context_menu',
            })
          },
        },
      ]
    : []

  return (
    <MenuSurface
      label={t('common:actions')}
      controller={controller}
      anchor={anchor}
      items={items}
    />
  )
}
