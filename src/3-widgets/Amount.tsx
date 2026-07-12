import React, { FC } from 'react'
import { OptionalExceptFor, TInstrumentId } from '6-shared/types'
import { AmountProps, Amount } from '6-shared/ui/Amount'

import {
  useCoreInstruments,
  useCoreUserInstrumentId,
} from 'zerro-core/redux'

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
  const userInstrumentId = useCoreUserInstrumentId()
  const instruments = useCoreInstruments()
  const id = props.instrument === 'user' ? userInstrumentId : props.instrument
  const currency = id ? instruments?.[id]?.shortTitle : undefined
  return <Amount {...props} currency={currency} />
}
