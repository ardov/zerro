import { TFxCode, TISOMonth } from '6-shared/types'
import { balances } from '5-entities/envBalances'

export const useCurrencyConverter = (month: TISOMonth) => {
  const rates = balances.useRates()[month]?.rates
  return (value: number, from: TFxCode, to: TFxCode) => {
    return (value * rates[from]) / rates[to]
  }
}
