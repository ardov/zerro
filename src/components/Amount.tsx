import React from 'react'
import { formatMoney } from 'helpers/format'

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
