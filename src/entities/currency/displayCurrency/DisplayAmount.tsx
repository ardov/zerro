import { Modify, TFxAmount, TISOMonth } from '@shared/types'
import { Amount, AmountProps } from '@shared/ui/Amount'
import { displayCurrency } from './displayCurrency'

type TDisplayAmountProps = Modify<
  AmountProps,
  {
    value: TFxAmount
    month: TISOMonth
    noCurrency?: boolean
  }
>

export const DisplayAmount = (props: TDisplayAmountProps) => {
  const { value, month, noCurrency, ...delegated } = props
  const [currency] = displayCurrency.useDisplayCurrency()
  const convert = displayCurrency.useToDisplay(month)
  return (
    <Amount
      value={convert(value)}
      currency={noCurrency ? undefined : currency}
      {...delegated}
    />
  )
}
