import React, { ReactNode } from 'react'
import { Box, BoxProps, Typography } from '@mui/material'
import { Tooltip } from '@shared/ui/Tooltip'
import { Amount, AmountProps } from '@shared/ui/Amount'

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
  currency?: string
}

export function Line({
  name,
  amount,
  description,
  currency,
  ...rest
}: LineProps) {
  return (
    <Box display="flex" flexDirection="row" {...rest}>
      <Box flexGrow={1} mr={1} minWidth={0}>
        {description ? (
          <Tooltip title={description}>
            <Typography noWrap variant="body2" children={name} />
          </Tooltip>
        ) : (
          <Typography noWrap variant="body2" children={name} />
        )}
      </Box>
      <Typography variant="body2">
        <Amount value={amount} currency={currency} />
      </Typography>
    </Box>
  )
}
