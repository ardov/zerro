import { Modify, TFxAmount, TISOMonth } from '6-shared/types'
import { Amount, AmountProps } from '6-shared/ui/Amount'
import { displayCurrency } from './model'

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
  const [currency] = displayCurrency.useDisplayCurrency()
  const convert = displayCurrency.useToDisplay(month || 'current')
  const amount = typeof value === 'number' ? value : convert(value)
  return (
    <Amount
      value={amount}
      currency={noCurrency ? undefined : currency}
      {...delegated}
    />
  )
}
