import { useCallback } from 'react'
import { createSelector } from '@reduxjs/toolkit'
import { TDateDraft, TFxAmount, TFxCode } from '@shared/types'

import { TSelector, useAppDispatch, useAppSelector } from '@store/index'
import { userModel } from '@entities/user'
import { fxRateModel } from '@entities/currency/fxRate'
import { getSavedCurrency, setSavedCurrency } from '@store/displayCurrency'

const getDisplayCurrency: TSelector<TFxCode> = createSelector(
  [getSavedCurrency, userModel.getUserCurrency],
  (savedCurrency, userCurrency) => savedCurrency || userCurrency
)

function useDisplayCurrency() {
  const currency = useAppSelector(getDisplayCurrency)
  const dispatch = useAppDispatch()
  const setDisplayCurrency = useCallback(
    (currency: TFxCode) => {
      dispatch(setSavedCurrency(currency))
    },
    [dispatch]
  )
  return [currency, setDisplayCurrency] as [TFxCode, typeof setDisplayCurrency]
}

const getConverter = createSelector(
  [fxRateModel.converter, getDisplayCurrency],
  (convert, displayCurrency) =>
    (amount: TFxAmount, date: 'current' | TDateDraft) =>
      convert(amount, displayCurrency, date)
)

const useToDisplay = (defaultMonth: TDateDraft | 'current') => {
  const [currency] = useDisplayCurrency()
  const convert = useAppSelector(fxRateModel.converter)
  const converter = useCallback(
    (amount: TFxAmount, date = defaultMonth) => convert(amount, currency, date),
    [convert, currency, defaultMonth]
  )
  return converter
}

export const displayCurrency = {
  useDisplayCurrency,
  useToDisplay,
  getConverter,
}
