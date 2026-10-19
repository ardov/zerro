import type { FC } from 'react'
import { useCallback } from 'react'
import { cn } from '@/6-shared/ui/shadcn/utils'
import type { core } from '@/zerro-core/redux'

import type { ComponentPropsWithoutRef } from 'react'
import { listItemDenseClass } from '@/6-shared/ui/ListRow'
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
    <button
      type="button"
      className={cn(listItemDenseClass, className)}
      {...rest}
      {...propsToPass}
    >
      <span className="mr-2 flex shrink-0 items-center">
        <AccountIcon account={account} />
      </span>
      <div
        className={cn(
          'relative min-w-0 grow overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_left,transparent,black_40px)]',
          account.archive && 'line-through'
        )}
        title={account.title}
      >
        {account.title}
      </div>

      <span
        className={cn(
          'ml-2 shrink-0',
          account.balance < 0 ? 'text-ui-error' : 'text-ui-secondary'
        )}
      >
        <Tooltip
          content={
            <Amount value={account.balance} currency={account.fxCode} noShade />
          }
          side="right"
        >
          <div>
            <Amount
              value={account.balance}
              currency={account.fxCode}
              decimals="ifOnly"
              noShade
            />
          </div>
        </Tooltip>
      </span>
    </button>
  )
}
