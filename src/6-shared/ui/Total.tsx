import type { ComponentPropsWithoutRef } from 'react'
import { cn } from './shadcn/utils'
import type { AmountProps } from '@/6-shared/ui/Amount'
import { Amount } from '@/6-shared/ui/Amount'

interface TotalProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  title: string
  /** Semantic state of the amount. A zero amount is muted either way. */
  amountColor?: 'error' | 'success'
  align?: 'center' | 'right' | 'left'
  value: AmountProps['value']
  currency?: AmountProps['currency']
  sign?: AmountProps['sign']
  decimals?: AmountProps['decimals']
  noShade?: AmountProps['noShade']
}

export function Total({
  align = 'center',
  title = '',
  value = 0,
  currency,
  sign = undefined,
  decimals,
  noShade = false,
  amountColor,
  ...rest
}: TotalProps) {
  const alignmentClassName =
    align === 'right'
      ? 'text-right'
      : align === 'left'
        ? 'text-left'
        : 'text-center'
  const amountClassName = cn(
    'm-0 text-title-lg',
    alignmentClassName,
    amountColor === 'error'
      ? 'text-error'
      : amountColor === 'success'
        ? 'text-success'
        : value
          ? 'text-foreground'
          : 'text-muted-foreground'
  )

  return (
    <div {...rest}>
      <p
        className={cn(
          'm-0 text-body-sm text-muted-foreground',
          alignmentClassName
        )}
      >
        {title}
      </p>
      <p className={amountClassName}>
        <Amount
          value={value}
          currency={currency}
          sign={sign}
          decimals={decimals}
          noShade={noShade}
        />
      </p>
    </div>
  )
}
