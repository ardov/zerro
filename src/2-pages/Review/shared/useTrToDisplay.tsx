import { useCoreInstCodeMap, useCoreToDisplay } from 'core-next/adapters/redux'
import { TTransaction } from '6-shared/types'

export function useTrToDisplay() {
  const toDisplay = useCoreToDisplay('current')
  const instCodeMap = useCoreInstCodeMap()

  return (tr: TTransaction) => {
    return {
      income: toDisplay({ [instCodeMap[tr.incomeInstrument]]: tr.income }),
      outcome: toDisplay({ [instCodeMap[tr.outcomeInstrument]]: tr.outcome }),
    }
  }
}
