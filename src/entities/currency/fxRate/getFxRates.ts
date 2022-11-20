import { createSelector } from '@reduxjs/toolkit'
import { TISOMonth, ByMonth, ById, TInstrument, TMsTime } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { toISOMonth } from '@shared/helpers/date'
import { TSelector } from '@store'
import { instrumentModel } from '@entities/currency/instrument'
import { fxRateStore, TFxRates, TFxRatesStoredValue } from './fxRateStore'

export type TFxRateData = {
  date: TISOMonth
  type: 'saved' | 'historical' | 'current'
  changed: TMsTime
  rates: TFxRates
}

export const getLatestRates: TSelector<TFxRateData> = createSelector(
  [instrumentModel.getInstruments],
  instruments => currentToRates(instruments)
)

export const getRates: TSelector<ByMonth<TFxRateData>> = createSelector(
  [getLatestRates, fxRateStore.getData],
  (latestRates, savedRates) => {
    return mergeRates(
      getHistoricalRates(),
      savedToRates(savedRates),
      latestRates
    )
  }
)

function getHistoricalRates() {
  // TODO
  return {} as ByMonth<TFxRateData>
}

/** Merges historical, current and saved rates according to their priorities */
function mergeRates(
  historical: ByMonth<TFxRateData>,
  saved: ByMonth<TFxRateData>,
  current: TFxRateData
): ByMonth<TFxRateData> {
  const result: ByMonth<TFxRateData> = {}
  const dates = [...keys(historical), ...keys(saved), current.date]
  const unique = [...new Set(dates)]
  unique.forEach(month => {
    result[month] = combine(saved[month], historical[month], current)
  })
  return result
}

function combine(
  saved: TFxRateData | undefined,
  historical: TFxRateData | undefined,
  current: TFxRateData
): TFxRateData {
  let node = saved || historical || current
  let rates: TFxRates = {}
  keys(current.rates).forEach(code => {
    rates[code] =
      saved?.rates[code] || historical?.rates[code] || current.rates[code]
  })
  node.rates = rates
  return node
}

/** Converts instrument collection to standard rates */
function currentToRates(instruments: ById<TInstrument>): TFxRateData {
  const result: TFxRateData = {
    date: toISOMonth(new Date()),
    type: 'current',
    changed: 0,
    rates: {},
  }
  Object.values(instruments).forEach(inst => {
    result.rates[inst.shortTitle] = inst.rate
    result.changed = Math.max(result.changed, inst.changed)
  })
  return result
}

/** Converts rate store to standard rates */
function savedToRates(
  saved: ByMonth<TFxRatesStoredValue>
): ByMonth<TFxRateData> {
  const result: ByMonth<TFxRateData> = {}
  keys(saved).forEach(month => {
    result[month] = { ...saved[month], type: 'saved' }
  })
  return result
}
