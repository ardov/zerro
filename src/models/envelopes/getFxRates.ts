import { TInstrument, TInstrumentId } from 'shared/types'
import { keys } from 'shared/helpers/keys'
import { TDateDraft } from 'shared/types'

export function makeFxRatesGetter(
  instruments: Record<TInstrumentId, TInstrument>
  // TODO: add saved and historical rates
) {
  let zmRates: Record<TInstrumentId, number> = {}
  keys(instruments).forEach(instrumentId => {
    zmRates[instrumentId] = instruments[instrumentId].rate
  })
  return function (date: TDateDraft) {
    return zmRates
  }
}
