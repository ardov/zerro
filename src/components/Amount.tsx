import React, { FC } from 'react'
import { OptionalExceptFor, TInstrumentId } from '@shared/types'
import { getInstruments } from '@entities/instrument'
import { useAppSelector } from '@store'
import { getUserInstrumentId } from '@entities/user'
import { AmountProps, Amount } from '@shared/ui/Amount'

export type TSmartAmountProps = AmountProps & {
  instrument?: TInstrumentId | 'user'
}

export const SmartAmount: FC<TSmartAmountProps> = props => {
  if (props.instrument !== undefined)
    return <ConnectedAmount {...props} instrument={props.instrument} />
  else return <Amount {...props} />
}

type ConnectedAmountProps = OptionalExceptFor<
  Required<TSmartAmountProps>,
  'value' | 'instrument'
>
function ConnectedAmount(props: ConnectedAmountProps) {
  const userInstrumentId = useAppSelector(getUserInstrumentId)
  const instruments = useAppSelector(getInstruments)
  const id = props.instrument === 'user' ? userInstrumentId : props.instrument
  const currency = id ? instruments?.[id]?.shortTitle : undefined
  return <Amount {...props} currency={currency} />
}
