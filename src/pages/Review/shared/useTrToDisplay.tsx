import { displayCurrency } from '@entities/currency/displayCurrency'
import { instrumentModel } from '@entities/currency/instrument'
import { TTransaction } from '@shared/types'

export function useTrToDisplay() {
  const toDisplay = displayCurrency.useToDisplay('current')
  const instCodeMap = instrumentModel.useInstCodeMap()

  return (tr: TTransaction) => {
    return {
      income: toDisplay({ [instCodeMap[tr.incomeInstrument]]: tr.income }),
      outcome: toDisplay({ [instCodeMap[tr.outcomeInstrument]]: tr.outcome }),
    }
  }
}
