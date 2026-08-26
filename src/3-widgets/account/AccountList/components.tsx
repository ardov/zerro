import type { FC, ReactNode } from 'react'
import { useCallback } from 'react'
import clsx from 'clsx'
import { core } from 'zerro-core/redux'

import type { ListItemButtonProps, ListSubheaderProps } from '@mui/material'
import { ListSubheader, ListItemButton } from '@mui/material'
import { toISOMonth } from '6-shared/helpers/date'
import { Amount } from '6-shared/ui/Amount'
import type { TFxAmount } from '6-shared/types'
import { Tooltip } from '6-shared/ui/Tooltip'

import { DisplayAmount } from '3-widgets/DisplayAmount'
import { useTransactionDrawer } from '3-widgets/global/TransactionListDrawer'
import { useAccountContextMenu } from '3-widgets/global/AccountContextMenu'
import { useContextMenu } from '6-shared/hooks/useContextMenu'
import { getEventPosition } from '3-widgets/global/shared/helpers'

export const Account: FC<
  { account: core.accounts.TAccountPopulated } & ListItemButtonProps
> = ({ account, className, sx, ...rest }) => {
  const transactionDrawer = useTransactionDrawer()
  const openContextMenu = useAccountContextMenu()
  const showTransactions = useCallback(
    () =>
      transactionDrawer.open({
        title: account.title,
        initialQuery: {
          clauses: [{ kind: 'account', ids: [account.id] }],
        },
      }),
    [account.id, account.title, transactionDrawer]
  )
  const propsToPass = useContextMenu({
    onContextMenu: e =>
      openContextMenu({ id: account.id }, getEventPosition(e)),
    onClick: showTransactions,
  })
  return (
    <ListItemButton
      className={clsx('flex rounded-lg type-body-sm', className)}
      sx={sx}
      {...rest}
      {...propsToPass}
    >
      <div
        className={clsx(
          'relative min-w-0 grow overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_left,transparent,black_40px)]',
          account.archive && 'line-through'
        )}
        title={account.title}
      >
        {account.title}
      </div>

      <span
        className={clsx(
          'ml-2 shrink-0',
          account.balance < 0 ? 'text-error' : 'text-muted-foreground'
        )}
      >
        <Tooltip
          title={
            <Amount value={account.balance} currency={account.fxCode} noShade />
          }
          disableInteractive
          placement="right"
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
    </ListItemButton>
  )
}

export const Subheader: FC<
  {
    name: ReactNode
    amount: TFxAmount
  } & ListSubheaderProps
> = ({ name, amount, className, sx, ...rest }) => {
  const month = toISOMonth(new Date())
  const toDisplay = core.currency.useToDisplay(month)
  const isNegative = toDisplay(amount) < 0
  return (
    <ListSubheader className={clsx('rounded-lg', className)} sx={sx} {...rest}>
      <span className="flex w-full">
        <span className="grow truncate type-body leading-[inherit]">
          <b>{name}</b>
        </span>

        <span
          className={clsx(
            'ml-4',
            isNegative ? 'text-error' : 'text-muted-foreground'
          )}
        >
          <b>
            <DisplayAmount
              month={month}
              value={amount}
              decimals="ifOnly"
              noShade
            />
          </b>
        </span>
      </span>
    </ListSubheader>
  )
}
