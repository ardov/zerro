import { Modify, TFxAmount, TISOMonth } from '@shared/types'
import { Amount, AmountProps } from '@shared/ui/Amount'
import { useDisplayCurrency, useToDisplay } from './displayCurrency'

type TDisplayAmountProps = Modify<
  AmountProps,
  {
    value: TFxAmount
    month: TISOMonth
  }
>

export const DisplayAmount = (props: TDisplayAmountProps) => {
  const { value, month, ...delegated } = props
  const [currency] = useDisplayCurrency()
  const convert = useToDisplay(month)
  return <Amount value={convert(value)} currency={currency} {...delegated} />
}
