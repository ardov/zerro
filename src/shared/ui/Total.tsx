import React from 'react'
import { Box, BoxProps, Typography } from '@mui/material'
import { Amount, AmountProps } from 'shared/ui/Amount'

interface TotalProps extends BoxProps {
  name: string
  align?: 'center' | 'right' | 'left'
  value: AmountProps['value']
  currency?: AmountProps['currency']
  sign?: AmountProps['sign']
  decMode?: AmountProps['decMode']
}

export function Total({
  align = 'center',
  name = '',
  value = 0,
  currency,
  sign = false,
  decMode,
  ...rest
}: TotalProps) {
  return (
    <Box {...rest}>
      <Typography
        align={align}
        variant="body2"
        color="textSecondary"
        children={name}
      />
      <Typography
        align={align}
        variant="h5"
        color={value ? 'textPrimary' : 'textSecondary'}
      >
        <Amount
          value={value}
          currency={currency}
          sign={sign}
          decMode={decMode}
        />
      </Typography>
    </Box>
  )
}
