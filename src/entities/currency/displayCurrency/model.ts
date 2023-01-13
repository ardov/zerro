import { useCallback } from 'react'
import { createLocalStorageStateHook } from 'use-local-storage-state'
import { TDateDraft, TFxAmount, TFxCode } from '@shared/types'
import { convertFx } from '@shared/helpers/money'

import { userModel } from '@entities/user'
import { createSelector } from '@reduxjs/toolkit'
import { fxRateModel } from '@entities/currency/fxRate'
import { RootState, useAppSelector } from '@store/index'

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

const useToDisplay = (defaultMonth: TDateDraft | 'current') => {
  const getRates = useAppSelector(fxRateModel.getter)
  const [displayCurrency] = useDisplayCurrency()
  const converter = useCallback(
    (amount: TFxAmount, date = defaultMonth) => {
      let rates = getRates(date).rates
      return convertFx(amount, displayCurrency, rates)
    },
    [defaultMonth, displayCurrency, getRates]
  )
  return converter
}

const getConverter = createSelector(
  [fxRateModel.getter, getDisplayCurrency],
  (getRates, displayCurrency) =>
    (amount: TFxAmount, date: 'current' | TDateDraft) => {
      const res = convertFx(amount, displayCurrency, getRates(date).rates)
      console.assert(
        !isNaN(res),
        'NaN in getConverter',
        amount,
        displayCurrency
      )
      return res
    }
)

export const displayCurrency = {
  useDisplayCurrency,
  useToDisplay,
  getConverter,
}
