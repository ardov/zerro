import { useCoreToDisplay } from 'core-next/adapters/redux'
import { instrumentModel } from '5-entities/currency/instrument'
import { TTransaction } from '6-shared/types'

export function useTrToDisplay() {
  const toDisplay = useCoreToDisplay('current')
  const instCodeMap = instrumentModel.useInstCodeMap()

  return (tr: TTransaction) => {
    return {
      income: toDisplay({ [instCodeMap[tr.incomeInstrument]]: tr.income }),
      outcome: toDisplay({ [instCodeMap[tr.outcomeInstrument]]: tr.outcome }),
    }
  }
}
