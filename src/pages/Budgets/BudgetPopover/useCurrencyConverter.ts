import { getMonthTotals } from '@entities/envelopeData'
import { TFxCode, TISOMonth } from '@shared/types'
import { useAppSelector } from '@store'

export const useCurrencyConverter = (month: TISOMonth) => {
  const rates = useAppSelector(getMonthTotals)[month]?.rates
  return (value: number, from: TFxCode, to: TFxCode) => {
    return (value * rates[from]) / rates[to]
  }
}
