import React, { FC } from 'react'
import { formatMoney } from 'helpers/format'
import { InstrumentId, OptionalExceptFor } from 'types'
import { getInstruments, getUserInstrumentId } from 'store/data/instruments'
import { useSelector } from 'react-redux'

const decStyle = { opacity: 0.5 }

export type AmountProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLSpanElement>,
  HTMLSpanElement
> & {
  value: number
  currency?: string
  instrument?: InstrumentId | 'user'
  sign?: boolean
  noShade?: boolean
  decimals?: number
  decMode?: 'always' | 'ifOnly' | 'ifAny'
  intProps?: React.HTMLProps<HTMLSpanElement>
  decProps?: React.HTMLProps<HTMLSpanElement>
}

export const Amount: FC<AmountProps> = props => {
  if (props.instrument !== undefined)
    return <ConnectedAmount {...props} instrument={props.instrument} />
  else return <SimpleAmount {...props} />
}

type ConnectedAmountProps = OptionalExceptFor<
  Required<AmountProps>,
  'value' | 'instrument'
>
function ConnectedAmount(props: ConnectedAmountProps) {
  const userInstrumentId = useSelector(getUserInstrumentId)
  const instruments = useSelector(getInstruments)
  const id = props.instrument === 'user' ? userInstrumentId : props.instrument
  const currency = id ? instruments?.[id]?.shortTitle : undefined
  return <SimpleAmount {...props} currency={currency} />
}

function SimpleAmount({
  value = 0,
  currency,
  sign = false,
  noShade = false,
  decimals = 2,
  decMode = 'always',
  intProps,
  decProps,
  ...rest
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
