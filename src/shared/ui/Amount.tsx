import React, { FC } from 'react'
import { formatMoney } from '@shared/helpers/money'
import { TFxCode } from '@shared/types'

export type AmountProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLSpanElement>,
  HTMLSpanElement
> & {
  value: number
  currency?: TFxCode
  sign?: boolean
  noShade?: boolean
  decimals?: number
  decMode?: 'always' | 'ifOnly' | 'ifAny'
  intProps?: React.HTMLProps<HTMLSpanElement>
  decProps?: React.HTMLProps<HTMLSpanElement>
}

const decStyle = { opacity: 0.5 }

export const Amount: FC<AmountProps> = props => {
  const {
    value = 0,
    currency,
    sign,
    noShade = false,
    decimals = 2,
    decMode = 'always',
    intProps,
    decProps,
    ...rest
  } = props
  let dec = decimals
  if (decMode === 'always') dec = decimals
  else if (decMode === 'ifOnly')
    dec = value !== 0 && value < 1 && value > -1 ? decimals : 0
  else if (decMode === 'ifAny') dec = value % 1 ? decimals : 0
  else throw Error('Unknown decMode ' + decMode)

  let str = ''
  if (value === 0) str = formatMoney(0, currency, dec)
  if (value < 0)
    str = (sign === false ? '' : '−') + formatMoney(-value, currency, dec)
  if (value > 0) str = (sign ? '+' : '') + formatMoney(value, currency, dec)
  const arr = str.split(',')
  if (arr.length === 2) {
    return (
      <span {...rest}>
        <span {...intProps}>{arr[0]},</span>
        <span style={noShade ? undefined : decStyle} {...decProps}>
          {arr[1]}
        </span>
      </span>
    )
  }
  return <span {...rest}>{str}</span>
}
