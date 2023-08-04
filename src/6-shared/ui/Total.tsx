import React from 'react'
import { Box, BoxProps, Typography } from '@mui/material'
import { Amount, AmountProps } from '6-shared/ui/Amount'

interface TotalProps extends BoxProps {
  title: string
  amountColor?: string
  align?: 'center' | 'right' | 'left'
  value: AmountProps['value']
  currency?: AmountProps['currency']
  sign?: AmountProps['sign']
  decMode?: AmountProps['decMode']
  noShade?: AmountProps['noShade']
}

export function Total({
  align = 'center',
  title = '',
  value = 0,
  currency,
  sign = undefined,
  decMode,
  noShade = false,
  amountColor,
  ...rest
}: TotalProps) {
  return (
    <Box {...rest}>
      <Typography
        align={align}
        variant="body2"
        color="textSecondary"
        children={title}
      />
      <Typography
        align={align}
        variant="h5"
        color={amountColor || (value ? 'textPrimary' : 'textSecondary')}
      >
        <Amount
          value={value}
          currency={currency}
          sign={sign}
          decMode={decMode}
          noShade={noShade}
        />
      </Typography>
    </Box>
  )
}
