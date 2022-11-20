import React, { FC } from 'react'
import { OptionalExceptFor, TInstrumentId } from '@shared/types'
import { AmountProps, Amount } from '@shared/ui/Amount'

import { instrumentModel } from '@entities/instrument'
import { userModel } from '@entities/user'

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
  const userInstrumentId = userModel.useUserInstrumentId()
  const instruments = instrumentModel.useInstruments()
  const id = props.instrument === 'user' ? userInstrumentId : props.instrument
  const currency = id ? instruments?.[id]?.shortTitle : undefined
  return <Amount {...props} currency={currency} />
}
