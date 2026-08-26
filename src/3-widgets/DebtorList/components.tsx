import type { FC, ReactNode } from 'react'
import { core } from 'zerro-core/redux'
import clsx from 'clsx'

import type { ListItemButtonProps, ListSubheaderProps } from '@mui/material'
import { ListSubheader, ListItemButton } from '@mui/material'
import type { TFxAmount, TFxCode } from '6-shared/types'
import { Amount } from '6-shared/ui/Amount'
import { DisplayAmount } from '3-widgets/DisplayAmount'
import { toISOMonth } from '6-shared/helpers/date'
import { Tooltip } from '6-shared/ui/Tooltip'

export const Debtor: FC<
  { name: string; currency: TFxCode; balance: number } & ListItemButtonProps
> = ({ name, currency, balance, className, sx, ...rest }) => {
  return (
    <ListItemButton
      className={clsx('flex rounded-lg type-body-sm', className)}
      sx={sx}
      {...rest}
    >
      <div
        className="relative min-w-0 grow overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_left,transparent,black_40px)]"
        title={name}
      >
        {name}
      </div>

      <span
        className={clsx(
          'ml-2 shrink-0',
          balance < 0 ? 'text-error' : 'text-muted-foreground'
        )}
      >
        <Tooltip
          title={<Amount value={balance} currency={currency} noShade />}
          disableInteractive
          placement="right"
        >
          <div>
            <Amount
              value={balance}
              currency={currency}
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
  return (
    <ListSubheader className={clsx('rounded-lg', className)} sx={sx} {...rest}>
      <span className="flex w-full">
        <span className="grow truncate leading-[inherit]">
          <b>{name}</b>
        </span>

        <span
          className={clsx(
            'ml-4',
            toDisplay(amount) < 0 ? 'text-error' : 'text-muted-foreground'
          )}
        >
          <b>
            <DisplayAmount
              value={amount}
              month={month}
              decimals="ifOnly"
              noShade
            />
          </b>
        </span>
      </span>
    </ListSubheader>
  )
}
