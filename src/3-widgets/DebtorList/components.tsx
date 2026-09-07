import type { FC, ReactNode } from 'react'
import { core } from '@/zerro-core/redux'
import { cn } from '@/6-shared/ui/shadcn/utils'

import type { ComponentPropsWithoutRef } from 'react'
import { ListRowSubheader, listItemDenseClass } from '@/6-shared/ui/ListRow'
import type { TFxAmount, TFxCode } from '@/6-shared/types'
import { Amount } from '@/6-shared/ui/Amount'
import { DisplayAmount } from '@/3-widgets/DisplayAmount'
import { toISOMonth } from '@/6-shared/helpers/date'
import { Tooltip } from '@/6-shared/ui/Tooltip'

export const Debtor: FC<
  { name: string; currency: TFxCode; balance: number } & Omit<
    ComponentPropsWithoutRef<'button'>,
    'children'
  >
> = ({ name, currency, balance, className, ...rest }) => {
  return (
    <button
      type="button"
      className={cn(listItemDenseClass, className)}
      {...rest}
    >
      <div
        className="relative min-w-0 grow overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_left,transparent,black_40px)]"
        title={name}
      >
        {name}
      </div>

      <span
        className={cn(
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
    </button>
  )
}

export const Subheader: FC<
  {
    name: ReactNode
    amount: TFxAmount
  } & ComponentPropsWithoutRef<'div'>
> = ({ name, amount, className, ...rest }) => {
  const month = toISOMonth(new Date())
  const toDisplay = core.currency.useToDisplay(month)
  return (
    <ListRowSubheader sticky className={cn('rounded-lg', className)} {...rest}>
      <span className="flex w-full">
        <span className="grow truncate text-body leading-[inherit]">
          <b>{name}</b>
        </span>

        <span
          className={cn(
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
    </ListRowSubheader>
  )
}
