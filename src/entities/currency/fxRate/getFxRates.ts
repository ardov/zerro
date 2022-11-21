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

export const getCurrentRates: TSelector<TFxRateData> = createSelector(
  [instrumentModel.getInstruments],
  (instruments: ById<TInstrument>): TFxRateData => {
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
)

export const getRates: TSelector<ByMonth<TFxRateData>> = createSelector(
  [getCurrentRates, fxRateStore.getData],
  (latestRates, savedRates) => {
    return mergeRates(savedToRates(savedRates), latestRates)
  }
)

/** Merges historical, current and saved rates according to their priorities */
function mergeRates(
  saved: ByMonth<TFxRateData>,
  current: TFxRateData
): ByMonth<TFxRateData> {
  const result: ByMonth<TFxRateData> = {}
  const dates = [...keys(saved), current.date]
  const unique = [...new Set(dates)]
  unique.forEach(month => {
    result[month] = combine(current, saved[month])
  })
  return result
}

function combine(current: TFxRateData, saved?: TFxRateData): TFxRateData {
  let node = saved || current
  let rates: TFxRates = {}
  keys(current.rates).forEach(code => {
    rates[code] = saved?.rates[code] || current.rates[code]
  })
  node.rates = rates
  return node
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
