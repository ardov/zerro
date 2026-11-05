import { toISOMonth } from '../../foundation/date'
import { keys } from '../../foundation/keys'
import { convertFx } from '../../zenmoney/model/money'
import type { ById, ByMonth } from '../../foundation/types'
import type { TDateDraft, TISOMonth, TMsTime } from '../../zenmoney/primitives'
import type { TFxAmount } from '../../zenmoney/model/money'
import type { TFxCode, TInstrument } from '../../zenmoney/entities/instruments'
import type { TReminder } from '../../zenmoney/entities/reminders'
import { getMonthlyHiddenData, HiddenDataType } from '../hidden-data'

export type TFxRates = Record<TFxCode, number>

export type TFxRatesStoredValue = {
  date: TISOMonth
  changed: TMsTime
  rates: TFxRates
}

export type TFxRateData = {
  date: TISOMonth
  type: 'saved' | 'historical' | 'current'
  changed: TMsTime
  rates: TFxRates
}

export type TFxRatesGetter = (date: TDateDraft | 'current') => TFxRateData

export type TFxConverter = (
  amount: TFxAmount,
  target: TFxCode,
  date: TDateDraft | 'current'
) => number

export function getStoredFxRates(
  reminders: ById<TReminder>
): ByMonth<TFxRatesStoredValue> {
  return getMonthlyHiddenData<TFxRatesStoredValue>(
    reminders,
    HiddenDataType.FxRates
  )
}

export function buildCurrentFxRates(input: {
  instruments: ById<TInstrument>
  currentMonth: TISOMonth
}): TFxRateData {
  const result: TFxRateData = {
    date: input.currentMonth,
    type: 'current',
    changed: 0,
    rates: {},
  }

  Object.values(input.instruments).forEach(instrument => {
    result.rates[instrument.shortTitle] = instrument.rate
    result.changed = Math.max(result.changed, instrument.changed)
  })

  return result
}

export function buildFxRates(input: {
  storedRates: ByMonth<TFxRatesStoredValue>
  currentRates: TFxRateData
}): ByMonth<TFxRateData> {
  return mergeRates(savedToRates(input.storedRates), input.currentRates)
}

export function buildFxRatesGetter(input: {
  rates: ByMonth<TFxRateData>
  currentRates: TFxRateData
}): TFxRatesGetter {
  const monthsWithRates = keys(input.rates).sort()
  const firstDate = monthsWithRates[0]
  const lastDate = monthsWithRates[monthsWithRates.length - 1]

  return (date: TDateDraft | 'current'): TFxRateData => {
    if (date === 'current') return input.currentRates
    if (!firstDate || !lastDate) return input.currentRates

    const month = toISOMonth(date)

    if (input.rates[month]) return input.rates[month]

    if (month <= firstDate) return input.rates[firstDate]
    if (month >= lastDate) return input.rates[lastDate]

    const prevDates = monthsWithRates.filter(d => d <= month)
    const monthToUse = prevDates[prevDates.length - 1]
    const result = input.rates[monthToUse]

    if (!result) {
      console.error(`No rates found for ${month}`)
      return input.currentRates
    }

    return result
  }
}

export function buildFxConverter(getter: TFxRatesGetter): TFxConverter {
  return (amount, target, date) => convertFx(amount, target, getter(date).rates)
}

function mergeRates(
  saved: ByMonth<TFxRateData>,
  current: TFxRateData
): ByMonth<TFxRateData> {
  const result: ByMonth<TFxRateData> = {}
  const dates = [...keys(saved), current.date]
  const unique = [...new Set(dates)]

  unique.forEach(month => {
    result[month] = combineRates(current, saved[month])
  })

  return result
}

function combineRates(current: TFxRateData, saved?: TFxRateData): TFxRateData {
  const node = saved || current
  const rates: TFxRates = {}

  keys(current.rates).forEach(code => {
    rates[code] = saved?.rates[code] || current.rates[code]
  })

  return { ...node, rates }
}

function savedToRates(
  saved: ByMonth<TFxRatesStoredValue>
): ByMonth<TFxRateData> {
  const result: ByMonth<TFxRateData> = {}

  keys(saved).forEach(month => {
    result[month] = { ...saved[month], type: 'saved' }
  })

  return result
}
