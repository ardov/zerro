import type { FC } from 'react'
import React from 'react'
import {
  formatMoney,
  formatValuation,
  type MoneyDecimals,
} from '@/6-shared/helpers/money/format'
import type { TFxCode } from '@/6-shared/types'

export type AmountProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLSpanElement>,
  HTMLSpanElement
> & {
  value: number
  currency?: TFxCode
  sign?: boolean
  noShade?: boolean
  showSubcent?: boolean
  decimals?: MoneyDecimals
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
    showSubcent = false,
    decimals = 2,
    intProps,
    decProps,
    ...rest
  } = props
  const format = showSubcent ? formatValuation : formatMoney
  let str = Number.isNaN(value) ? '' : format(value, currency, decimals)
  if (value < 0) str = str.replace(/^-/, sign === false ? '' : '−')
  if (value > 0 && sign) str = '+' + str
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
