import type { FC } from 'react'
import { useCallback } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import type { core } from '@/zerro-core/redux'

import type { ComponentPropsWithoutRef } from 'react'
import { ListRowButton } from '@/6-shared/ui/kit/ListRow'
import { TextFade } from '@/6-shared/ui/kit/TextFade'
import { Amount } from '@/6-shared/ui/Amount'
import { Tooltip } from '@/6-shared/ui/kit/Tooltip'

import { useTransactionDrawer } from '@/3-widgets/global/TransactionListDrawer'
import { AccountMenu } from '@/3-widgets/global/AccountContextMenu'
import { useAsk } from '@/6-shared/overlays'
import { useContextMenu } from '@/6-shared/hooks/useContextMenu'
import { getEventAnchor } from '@/3-widgets/global/shared/helpers'
import { AccountIcon } from '../AccountIcon'

export const Account: FC<
  { account: core.accounts.TAccountPopulated } & Omit<
    ComponentPropsWithoutRef<'button'>,
    'children'
  >
> = ({ account, className, ...rest }) => {
  const transactionDrawer = useTransactionDrawer()
  const ask = useAsk()
  const showTransactions = useCallback(
    () =>
      transactionDrawer({
        title: account.title,
        initialQuery: {
          clauses: [{ kind: 'account', ids: [account.id] }],
        },
      }),
    [account.id, account.title, transactionDrawer]
  )
  const propsToPass = useContextMenu({
    onContextMenu: e =>
      ask(<AccountMenu id={account.id} anchor={getEventAnchor(e)} />),
    onClick: showTransactions,
  })
  return (
    <ListRowButton
      size="sm"
      className={className}
      {...rest}
      {...propsToPass}
      start={<AccountIcon account={account} />}
      end={
        <Tooltip
          content={
            <Amount value={account.balance} currency={account.fxCode} noShade />
          }
          side="right"
        >
          <Amount
            className={cn(
              'block whitespace-nowrap',
              account.balance < 0 ? 'text-ui-error' : 'text-ui-secondary'
            )}
            value={account.balance}
            currency={account.fxCode}
            decimals="ifOnly"
            noShade
          />
        </Tooltip>
      }
    >
      <TextFade
        className={cn(account.archive && 'line-through')}
        title={account.title}
      >
        {account.title}
      </TextFade>
    </ListRowButton>
  )
}
