import React, { FC } from 'react'
import { formatMoney } from '6-shared/helpers/money'
import { TFxCode } from '6-shared/types'

export type AmountProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLSpanElement>,
  HTMLSpanElement
> & {
  value: number
  currency?: TFxCode
  sign?: boolean
  noShade?: boolean
  decimals?: number | 'ifOnly' | 'ifAny'
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
    intProps,
    decProps,
    ...rest
  } = props
  let str = ''
  if (value === 0) str = formatMoney(0, currency, decimals)
  if (value < 0)
    str = (sign === false ? '' : '−') + formatMoney(-value, currency, decimals)
  if (value > 0)
    str = (sign ? '+' : '') + formatMoney(value, currency, decimals)
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
