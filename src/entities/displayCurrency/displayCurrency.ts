import { useCallback } from 'react'
import { createLocalStorageStateHook } from 'use-local-storage-state'
import { TFxAmount, TFxCode, TISOMonth } from '@shared/types'
import { convertFx } from '@shared/helpers/money'
import { useAppSelector } from '@store'

import { getUserCurrencyCode } from '@entities/instrument'
import { balances } from '@entities/envBalances'

const useSavedDisplayCurrency = createLocalStorageStateHook<TFxCode | null>(
  'display-currency',
  null
)

export function useDisplayCurrency() {
  const userCurrency = useAppSelector(getUserCurrencyCode)
  const [savedCurrency, setSavedCurrency] = useSavedDisplayCurrency()
  const currency = savedCurrency || userCurrency
  return [currency, setSavedCurrency] as [TFxCode, typeof setSavedCurrency]
}

export const useToDisplay = (month: TISOMonth) => {
  const rates = balances.useRates()[month].rates
  const [displayCurrency] = useDisplayCurrency()
  const converter = useCallback(
    (amount: TFxAmount) => convertFx(amount, displayCurrency, rates),
    [displayCurrency, rates]
  )
  return converter
}
