import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { core } from '@/zerro-core/redux'
import type { TFxAmount } from '@/6-shared/types'
import { toISOMonth } from '@/6-shared/helpers/date'
import { ListRowSubheader } from '@/6-shared/ui/ListRow'
import { TextFade } from '@/6-shared/ui/kit/TextFade'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { DisplayAmount } from './DisplayAmount'

/** A group heading with its balance in the current display currency. */
export function BalanceSubheader({
  name,
  amount,
  className,
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  name: ReactNode
  amount: TFxAmount
}) {
  const month = toISOMonth(new Date())
  const toDisplay = core.currency.useToDisplay(month)
  const isNegative = toDisplay(amount) < 0
  return (
    <ListRowSubheader sticky className={cn('rounded-lg', className)} {...props}>
      <span className="flex w-full">
        <TextFade className="grow text-body leading-[inherit]">
          <b>{name}</b>
        </TextFade>
        <span
          className={cn(
            'ml-4',
            isNegative ? 'text-ui-error' : 'text-ui-secondary'
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
    </ListRowSubheader>
  )
}
