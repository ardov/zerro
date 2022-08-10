import React, { ReactNode } from 'react'
import { Box, BoxProps, Typography, TypographyProps } from '@mui/material'
import { Tooltip } from 'shared/ui/Tooltip'
import { Amount, AmountProps } from 'shared/ui/Amount'
import { TFxCode } from 'shared/types'

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

interface LineProps extends BoxProps {
  name: ReactNode
  amount: number
  description?: string
  currency?: TFxCode
  variant?: TypographyProps['variant']
}

export function Line({
  name,
  amount,
  description,
  currency,
  variant = 'body2',
  ...rest
}: LineProps) {
  return (
    <Box display="flex" flexDirection="row" {...rest}>
      <Box flexGrow={1} mr={1} minWidth={0}>
        <Tooltip title={description}>
          <Typography noWrap variant={variant} children={name} />
        </Tooltip>
      </Box>
      <Typography variant={variant}>
        <Amount value={amount} currency={currency} />
      </Typography>
    </Box>
  )
}
