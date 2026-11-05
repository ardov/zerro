import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { core } from '@/zerro-core/redux'
import type { TFxAmount } from '@/6-shared/types'
import { toISOMonth } from '@/6-shared/helpers/date'
import { ListRowHeader, type ListRowSize } from '@/6-shared/ui/kit/ListRow'
import { TextFade } from '@/6-shared/ui/kit/TextFade'
import { cn } from '@/6-shared/ui/shadcn/utils'
import { DisplayAmount } from './DisplayAmount'

/** A group heading with its balance in the current display currency. */
export function BalanceSubheader({
  name,
  amount,
  className,
  size = 'sm',
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  name: ReactNode
  amount: TFxAmount
  size?: ListRowSize
}) {
  const month = toISOMonth(new Date())
  const toDisplay = core.currency.useToDisplay(month)
  const isNegative = toDisplay(amount) < 0
  return (
    <ListRowHeader
      size={size}
      className={cn('sticky top-0 z-[1] flex bg-ui-card', className)}
      {...props}
    >
      <TextFade className="grow text-body font-bold leading-[inherit]">
        {name}
      </TextFade>
      <DisplayAmount
        className={cn(
          'ml-4 shrink-0 whitespace-nowrap font-bold',
          isNegative ? 'text-ui-error' : 'text-ui-secondary'
        )}
        month={month}
        value={amount}
        decimals="ifOnly"
        noShade
      />
    </ListRowHeader>
  )
}
