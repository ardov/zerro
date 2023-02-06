import { useCallback } from 'react'
import { createSelector } from '@reduxjs/toolkit'
import { createLocalStorageStateHook } from 'use-local-storage-state'
import { TDateDraft, TFxAmount, TFxCode } from '@shared/types'

import { RootState, useAppSelector } from '@store/index'
import { userModel } from '@entities/user'
import { fxRateModel } from '@entities/currency/fxRate'

// TODO
// Create separate store with display currency and use selectors from there

const KEY = 'display-currency'

const useSavedDisplayCurrency = createLocalStorageStateHook<TFxCode | null>(
  KEY,
  null
)

function getDisplayCurrency(state: RootState): TFxCode {
  const savedCurrencyRaw = localStorage.getItem(KEY)
  const parsedCurrency = savedCurrencyRaw
    ? (JSON.parse(savedCurrencyRaw) as TFxCode)
    : null
  return parsedCurrency || userModel.getUserCurrency(state)
}

function useDisplayCurrency() {
  const userCurrency = userModel.useUserCurrency()
  const [savedCurrency, setSavedCurrency] = useSavedDisplayCurrency()
  const currency = savedCurrency || userCurrency
  return [currency, setSavedCurrency] as [TFxCode, typeof setSavedCurrency]
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
