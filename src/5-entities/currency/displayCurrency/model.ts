import { useCallback } from 'react'
import { createSelector } from '@reduxjs/toolkit'
import { TDateDraft, TFxAmount, TFxCode } from '6-shared/types'

import { TSelector, useAppDispatch, useAppSelector } from 'store/index'
import { userModel } from '5-entities/user'
import { getConverter as getFxConverter } from '5-entities/currency/fxRate/converter'
import { getSavedCurrency, setSavedCurrency } from 'store/displayCurrency'

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

const getConverter: TSelector<
  (amount: TFxAmount, date: 'current' | TDateDraft) => number
> = createSelector(
  [getFxConverter, getDisplayCurrency],
  (convert, displayCurrency) =>
    (amount: TFxAmount, date: 'current' | TDateDraft) =>
      convert(amount, displayCurrency, date)
)

export const displayCurrency = {
  useDisplayCurrency,
  getConverter,
}
