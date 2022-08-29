import { createSelector } from '@reduxjs/toolkit'
import { TISOMonth, TDateDraft } from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { toISOMonth } from '@shared/helpers/date'
import { TSelector } from '@store'
import { getInstruments } from '@models/instrument'
import { fxRateStore, TFxRates } from './fxRateStore'

// TODO: write normal function
const getHistoricalRates = () => ({} as Record<TISOMonth, TFxRates>)

export const getRates: TSelector<Record<TISOMonth, TFxRates>> = createSelector(
  [getInstruments, fxRateStore.getData, getHistoricalRates],
  (instruments, hiddenRates, historicalRates) => {
    const result: Record<TISOMonth, TFxRates> = {}

    const currentDate = toISOMonth(Date.now())
    const currentRates: TFxRates = {}
    keys(instruments).forEach(id => {
      const { shortTitle, rate } = instruments[id]
      currentRates[shortTitle] = rate
    })

    // Fill with current rates
    result[currentDate] = currentRates

    // Fill with historical rates
    keys(historicalRates).forEach(date => {
      const rates: TFxRates = {}
      keys(currentRates).forEach(code => {
        rates[code] = historicalRates?.[date]?.[code] || currentRates[code]
      })
      result[date] = rates
    })

    // Fill with hidden rates
    keys(hiddenRates).forEach(date => {
      const rates: TFxRates = {}
      keys(currentRates).forEach(code => {
        rates[code] = hiddenRates[date][code] || currentRates[code]
      })
      result[date] = rates
    })

    return result
  }
)

export const getFxRatesGetter: TSelector<(date: TDateDraft) => TFxRates> =
  createSelector([getRates], rates => (date: TDateDraft): TFxRates => {
    const d = findDate(keys(rates).sort(), date)
    return rates[d]
  })

/**
 * Returns the exact date from the array
 * or previous date no exact match
 * or the first date in the array if no previous date
 */
function findDate(dates: TISOMonth[], date: TDateDraft): TISOMonth {
  const dateStr = toISOMonth(date)
  const prevDates = dates.filter(d => d <= dateStr)
  if (prevDates.length) {
    return prevDates[prevDates.length - 1]
  }
  return dates[0]
}
