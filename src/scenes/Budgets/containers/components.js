import React from 'react'
import { formatMoney } from 'helpers/format'
import { Box, Typography } from '@material-ui/core'

function Amount({
  value = 0,
  currency,
  sign = false,
  decimals,
  intProps,
  decProps,
}) {
  let str = ''
  if (value === 0) str = formatMoney(0, currency, decimals)
  if (value < 0) str = '−' + formatMoney(-value, currency, decimals)
  if (value > 0)
    str = (sign ? '+' : '') + formatMoney(value, currency, decimals)
  const arr = str.split(',')
  if (arr.length === 2) {
    return (
      <>
        <span {...intProps}>{arr[0]},</span>
        <span style={{ opacity: 0.5 }} {...decProps}>
          {arr[1]}
        </span>
      </>
    )
  }
  return str
}

export function Total({
  name = '',
  value = 0,
  currency,
  sign = false,
  ...rest
}) {
  return (
    <Box {...rest}>
      <Typography
        align="center"
        variant="body2"
        color="textSecondary"
        children={name}
      />
      <Typography
        align="center"
        variant="h5"
        color={value ? 'textPrimary' : 'textSecondary'}
      >
        <Amount value={value} currency={currency} sign={sign} />
      </Typography>
    </Box>
  )
}

export function Line({ name, amount, currency }) {
  return (
    <Box display="flex" flexDirection="row">
      <Box flexGrow="1" mr={1} minWidth={0}>
        <Typography noWrap variant="body2">
          {name}
        </Typography>
      </Box>

      <Typography variant="body2">{formatMoney(amount, currency)}</Typography>
    </Box>
  )
}
