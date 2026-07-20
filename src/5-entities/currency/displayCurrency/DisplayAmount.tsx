import type { Modify, TFxAmount, TISOMonth } from '6-shared/types'
import { core } from 'zerro-core/redux'

import type { AmountProps } from '6-shared/ui/Amount'
import { Amount } from '6-shared/ui/Amount'

type TDisplayAmountProps = Modify<
  AmountProps,
  {
    value: TFxAmount | number
    month?: TISOMonth
    noCurrency?: boolean
  }
>

export const DisplayAmount = (props: TDisplayAmountProps) => {
  const { value, month, noCurrency, ...delegated } = props
  const [currency] = core.currency.useDisplayCurrency()
  const convert = core.currency.useToDisplay(month || 'current')
  const amount = typeof value === 'number' ? value : convert(value)
  return (
    <Amount
      value={amount}
      currency={noCurrency ? undefined : currency}
      {...delegated}
    />
  )
}
