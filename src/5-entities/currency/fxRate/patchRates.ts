import { TISODate, TISOMonth } from '6-shared/types'
import { AppThunk } from 'store/index'
import { keys } from 'lodash'
import { getFxRatesGetter } from './getFxRatesGetter'
import { fxRateStore, TFxRates, TFxRatesStoredValue } from './fxRateStore'
import { firstPossibleDate, requestRates } from '6-shared/api/fxRates'
import { toISOMonth } from '6-shared/helpers/date'
import { getCurrentRates } from './getFxRates'

export const editRates =
  (patch: TFxRates, month: TISOMonth): AppThunk =>
  (dispatch, getState) => {
    const rateGetter = getFxRatesGetter(getState())
    const currentValues = rateGetter(month)
    const newData: TFxRatesStoredValue = {
      date: month,
      changed: Date.now(),
      rates: { ...currentValues.rates },
    }
    keys(patch).forEach(code => {
      if (patch[code]) {
        newData.rates[code] = patch[code]
      }
    })

    dispatch(fxRateStore.setData(newData, month))
  }

/** Resets saved rates for month */
export const resetRates =
  (month: TISOMonth): AppThunk =>
  dispatch => {
    dispatch(fxRateStore.resetMonth(month))
  }

export const freezeCurrentRates =
  (month: TISOMonth): AppThunk =>
  (dispatch, getState) => {
    const rateGetter = getFxRatesGetter(getState())
    const currentValues = rateGetter(month)
    dispatch(editRates(currentValues.rates, month))
  }

/** Returns date for which rates should be requested (28th) */
const getRequestDate = (month: TISOMonth) => (month + '-28') as TISODate

export const canFetchRates = (month: TISOMonth) => {
  const isPastMonth = month < toISOMonth(new Date())
  const apiHasData = getRequestDate(month) >= firstPossibleDate
  return isPastMonth && apiHasData
}

export const loadRates =
  (month: TISOMonth): AppThunk =>
  async (dispatch, getState) => {
    const isPastMonth = month < toISOMonth(new Date())

    if (!isPastMonth) {
      const latest = getCurrentRates(getState()).rates
      dispatch(editRates(latest, month))
      return
    }

    const date = getRequestDate(month)

    const rates =
      date < firstPossibleDate
        ? await requestRates(firstPossibleDate)
        : await requestRates(date)
    dispatch(editRates(rates, month))
  }
