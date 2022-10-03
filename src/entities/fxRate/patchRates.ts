import { TISOMonth } from '@shared/types'
import { AppThunk } from '@store/index'
import { keys } from 'lodash'
import { getFxRatesGetter } from './getFxRatesGetter'
import { fxRateStore, TFxRates, TFxRatesStoredValue } from './fxRateStore'

export const editRates =
  (patch: TFxRates, month: TISOMonth): AppThunk =>
  (dispatch, getState) => {
    const rateGetter = getFxRatesGetter(getState())
    const currentValues = rateGetter(month)
    const newData: TFxRatesStoredValue = {
      date: currentValues.date,
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

export const resetRates =
  (month: TISOMonth): AppThunk =>
  dispatch => {
    dispatch(fxRateStore.resetMonth(month))
  }

export const freezeRates =
  (month: TISOMonth): AppThunk =>
  (dispatch, getState) => {
    const rateGetter = getFxRatesGetter(getState())
    const currentValues = rateGetter(month)
    dispatch(editRates(currentValues.rates, month))
  }
