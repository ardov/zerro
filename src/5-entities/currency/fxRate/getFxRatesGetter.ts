import type { TDateDraft } from '6-shared/types'
import type { TSelector } from 'store'

import { createSelector } from '@reduxjs/toolkit'
import { keys } from '6-shared/helpers/keys'
import { toISOMonth } from '6-shared/helpers/date'

import { TFxRateData, getRates, getCurrentRates } from './getFxRates'

export const getFxRatesGetter: TSelector<
  (date: TDateDraft | 'current') => TFxRateData
> = createSelector([getRates, getCurrentRates], (rates, latestRates) => {
  const monthsWithRates = keys(rates).sort()
  const firstDate = monthsWithRates[0]
  const lastDate = monthsWithRates[monthsWithRates.length - 1]
  return (date: TDateDraft | 'current'): TFxRateData => {
    if (date === 'current') return latestRates

    // Convert date to ISO month
    const month = toISOMonth(date)

    // Return exact match if available
    if (rates[month]) return rates[month]

    // Use first or last date if the date is outside the available range
    if (month <= firstDate) return rates[firstDate]
    if (month >= lastDate) return rates[lastDate]

    // Othrwise get rates from the closest past month
    const prevDates = monthsWithRates.filter(d => d <= month)
    const monthToUse = prevDates[prevDates.length - 1]
    const result = rates[monthToUse]

    if (!result) {
      // Error happened, return latest rates as a fallback
      console.error(`No rates found for ${month}`)
      return latestRates
    }

    return result
  }
})
