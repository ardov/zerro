import type { ComponentPropsWithoutRef } from 'react'
import { Typography } from '@mui/material'
import type { AmountProps } from '6-shared/ui/Amount'
import { Amount } from '6-shared/ui/Amount'

interface TotalProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  title: string
  amountColor?: string
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
  return (
    <div {...rest}>
      <Typography
        align={align}
        variant="body2"
        children={title}
        className="text-muted-foreground"
      />
      <Typography
        align={align}
        variant="h5"
        color={amountColor || (value ? 'text.primary' : 'text.secondary')}
      >
        <Amount
          value={value}
          currency={currency}
          sign={sign}
          decimals={decimals}
          noShade={noShade}
        />
      </Typography>
    </div>
  )
}
