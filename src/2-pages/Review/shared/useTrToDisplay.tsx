import * as core from 'zerro-core/redux'

import { TTransaction } from '6-shared/types'

export function useTrToDisplay() {
  const toDisplay = core.currency.useToDisplay('current')
  const instCodeMap = core.instruments.useCodeMap()

  return (tr: TTransaction) => {
    return {
      income: toDisplay({ [instCodeMap[tr.incomeInstrument]]: tr.income }),
      outcome: toDisplay({ [instCodeMap[tr.outcomeInstrument]]: tr.outcome }),
    }
  }
}
