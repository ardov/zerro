import { TISODate, TISOMonth } from '@shared/types'
import { AppThunk } from '@store/index'
import { keys } from 'lodash'
import { getFxRatesGetter } from './getFxRatesGetter'
import { fxRateStore, TFxRates, TFxRatesStoredValue } from './fxRateStore'
import { firstPossibleDate, requestRates } from '@shared/api/fxRates'
import { toISOMonth } from '@shared/helpers/date'
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

export const loadRates =
  (month: TISOMonth): AppThunk =>
  async (dispatch, getState) => {
    const currMonth = toISOMonth(new Date())

    if (month >= currMonth) {
      const latest = getCurrentRates(getState()).rates
      dispatch(editRates(latest, month))
      return
    }

    const date = (month + '-28') as TISODate

    const rates =
      date < firstPossibleDate
        ? await requestRates(firstPossibleDate)
        : await requestRates(date)
    dispatch(editRates(rates, month))
  }
