import { TFxCode, TISOMonth } from 'shared/types'
import { keys } from 'shared/helpers/keys'
import { createSelector } from '@reduxjs/toolkit'
import { getInstruments } from 'models/instrument'
import { toISOMonth } from 'shared/helpers/date'
import { getMonthList } from './monthList'

// TODO: write normal function
const getHiddenRates = () =>
  ({} as { [date: TISOMonth]: Record<TFxCode, number> })

const getHistoricalRates = () =>
  ({} as { [date: TISOMonth]: Record<TFxCode, number> })

const getRates = createSelector(
  [getInstruments, getHiddenRates, getHistoricalRates],
  (instruments, hiddenRates, historicalRates) => {
    const result: {
      [date: TISOMonth]: {
        date: TISOMonth
        rates: Record<TFxCode, number>
      }
    } = {}

    const currentDate = toISOMonth(Date.now())
    const currentRates: Record<TFxCode, number> = {}
    keys(instruments).forEach(instrumentId => {
      const instrument = instruments[instrumentId]
      currentRates[instrument.shortTitle] = instrument.rate
    })

    // Fill with current rates
    result[currentDate] = {
      date: currentDate,
      rates: currentRates,
    }

    // Fill with historical rates
    keys(historicalRates).forEach(date => {
      const rates: Record<TFxCode, number> = {}
      keys(currentRates).forEach(code => {
        rates[code] = historicalRates?.[date]?.[code] || currentRates[code]
      })
      result[date] = { date, rates }
    })

    // Fill with hidden rates
    keys(hiddenRates).forEach(date => {
      const rates: Record<TFxCode, number> = {}
      keys(currentRates).forEach(code => {
        rates[code] = hiddenRates[date][code] || currentRates[code]
      })
      result[date] = { date, rates }
    })

    return result
  }
)

export const getMonthlyRates = createSelector(
  [getMonthList, getRates],
  (months, rates) => {
    const result: {
      [date: TISOMonth]: Record<TFxCode, number>
    } = {}

    // If there is no rates for current month, and there is rates for previous month, use them. If no, use closest rates in the future.
    const firstMonth = keys(rates).sort()[0]

    let lastAddedRates = rates[firstMonth].rates
    months.forEach(date => {
      if (rates[date]) {
        result[date] = rates[date].rates
        lastAddedRates = rates[date].rates
      } else {
        result[date] = lastAddedRates
      }
    })

    return result
  }
)
