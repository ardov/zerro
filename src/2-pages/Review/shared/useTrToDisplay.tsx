import {
  currency as coreCurrency,
  instruments as coreInstruments,
} from 'zerro-core/redux'

import { TTransaction } from '6-shared/types'

export function useTrToDisplay() {
  const toDisplay = coreCurrency.useToDisplay('current')
  const instCodeMap = coreInstruments.useCodeMap()

  return (tr: TTransaction) => {
    return {
      income: toDisplay({ [instCodeMap[tr.incomeInstrument]]: tr.income }),
      outcome: toDisplay({ [instCodeMap[tr.outcomeInstrument]]: tr.outcome }),
    }
  }
}
