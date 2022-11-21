import { useCallback } from 'react'
import { createLocalStorageStateHook } from 'use-local-storage-state'
import { TFxAmount, TFxCode, TInstrumentId, TISOMonth } from '@shared/types'
import { convertFx } from '@shared/helpers/money'

import { balances } from '@entities/envBalances'
import { userModel } from '@entities/user'
import { createSelector } from '@reduxjs/toolkit'
import { fxRateModel } from '@entities/currency/fxRate'
import { instrumentModel } from '@entities/currency/instrument'
import { RootState, useAppSelector } from '@store/index'

const KEY = 'display-currency'

const useSavedDisplayCurrency = createLocalStorageStateHook<TFxCode | null>(
  KEY,
  null
)

function getDisplayCurrency(state: RootState) {
  const savedCurrency = localStorage.getItem(KEY) || null
  const userCurrency = userModel.getUserCurrency(state)
  return savedCurrency || userCurrency
}

function useDisplayCurrency() {
  const userCurrency = userModel.useUserCurrency()
  const [savedCurrency, setSavedCurrency] = useSavedDisplayCurrency()
  const currency = savedCurrency || userCurrency
  return [currency, setSavedCurrency] as [TFxCode, typeof setSavedCurrency]
}

const useToDisplay = (month: TISOMonth | 'current') => {
  const currentRates = useAppSelector(fxRateModel.latest).rates
  const ratesByMonth = balances.useRates()
  const [displayCurrency] = useDisplayCurrency()
  const converter = useCallback(
    (amount: TFxAmount) => {
      if (month === 'current') {
        return convertFx(amount, displayCurrency, currentRates)
      }
      return convertFx(amount, displayCurrency, ratesByMonth[month].rates)
    },
    [month, displayCurrency, ratesByMonth, currentRates]
  )
  return converter
}

const convertCurrency = createSelector(
  [fxRateModel.getter, instrumentModel.getInstCodeMap, getDisplayCurrency],
  (getRates, instCodeMap, displayCurrency) =>
    (amount = 0, from: TInstrumentId) => {
      const rates = getRates('current').rates
      const rateFrom = rates[instCodeMap[from]]
      const rateTo = rates[displayCurrency]
      return amount * (rateFrom / rateTo)
    }
)

export const displayCurrency = {
  useDisplayCurrency,
  useToDisplay,
  convertCurrency,
}
