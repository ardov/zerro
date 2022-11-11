import { TFxCode, TISOMonth } from '@shared/types'
import { balances } from '@entities/envBalances'

export const useCurrencyConverter = (month: TISOMonth) => {
  const rates = balances.useRates()[month]?.rates
  return (value: number, from: TFxCode, to: TFxCode) => {
    return (value * rates[from]) / rates[to]
  }
}
