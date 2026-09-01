import type { FC } from 'react'
import type { OptionalExceptFor, TInstrumentId } from '@/6-shared/types'
import type { AmountProps } from '@/6-shared/ui/Amount'
import { Amount } from '@/6-shared/ui/Amount'

import { core } from '@/zerro-core/redux'

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
  const userInstrumentId = core.users.useInstrumentId()
  const instruments = core.instruments.useAll()
  const id = props.instrument === 'user' ? userInstrumentId : props.instrument
  const currency = id ? instruments?.[id]?.shortTitle : undefined
  return <Amount {...props} currency={currency} />
}
