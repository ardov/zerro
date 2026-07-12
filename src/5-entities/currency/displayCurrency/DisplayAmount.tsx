import { Modify, TFxAmount, TISOMonth } from '6-shared/types'
import { useCoreDisplayCurrency } from 'zerro-core/redux'
import { useCoreToDisplay } from 'zerro-core/redux'
import { Amount, AmountProps } from '6-shared/ui/Amount'

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
  const [currency] = useCoreDisplayCurrency()
  const convert = useCoreToDisplay(month || 'current')
  const amount = typeof value === 'number' ? value : convert(value)
  return (
    <Amount
      value={amount}
      currency={noCurrency ? undefined : currency}
      {...delegated}
    />
  )
}
