import React from 'react'
import { formatMoney } from 'helpers/format'
import { Box, Typography } from '@material-ui/core'
import { Tooltip } from 'components/Tooltip'

const decStyle = { opacity: 0.5 }

type AmountProps = {
  value: number
  currency?: string
  sign?: boolean
  noShade?: boolean
  decimals?: number
  decMode?: 'always' | 'ifOnly' | 'ifAny'
  intProps?: any
  decProps?: any
}

export function Amount({
  value = 0,
  currency,
  sign = false,
  noShade = false,
  decimals = 2,
  decMode = 'always',
  intProps,
  decProps,
}: AmountProps) {
  let dec = decimals
  if (decMode === 'always') dec = decimals
  else if (decMode === 'ifOnly')
    dec = value !== 0 && value < 1 && value > -1 ? decimals : 0
  else if (decMode === 'ifAny') dec = value % 1 ? decimals : 0
  else throw Error('Unknown decMode ' + decMode)

  let str = ''
  if (value === 0) str = formatMoney(0, currency, dec)
  if (value < 0) str = '−' + formatMoney(-value, currency, dec)
  if (value > 0) str = (sign ? '+' : '') + formatMoney(value, currency, dec)
  const arr = str.split(',')
  if (arr.length === 2) {
    return (
      <>
        <span {...intProps}>{arr[0]},</span>
        <span style={noShade ? null : decStyle} {...decProps}>
          {arr[1]}
        </span>
      </>
    )
  }
  return <>{str}</>
}

type TotalProps = {
  name: string
  value: number
  align?: 'center' | 'right' | 'left'
  currency?: string
  sign?: boolean
  [x: string]: any
}

export function Total({
  align = 'center',
  name = '',
  value = 0,
  currency,
  sign = false,
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
        <Amount value={value} currency={currency} sign={sign} />
      </Typography>
    </Box>
  )
}

type LineProps = {
  name: string
  amount: number
  description: string
  currency?: string
  [x: string]: any
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
      <Box flexGrow="1" mr={1} minWidth={0}>
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
