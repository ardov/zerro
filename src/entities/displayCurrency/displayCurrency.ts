import { useCallback } from 'react'
import { createLocalStorageStateHook } from 'use-local-storage-state'
import { TFxAmount, TFxCode, TISOMonth } from '@shared/types'
import { convertFx } from '@shared/helpers/money'

import { balances } from '@entities/envBalances'
import { userModel } from '@entities/user'

const useSavedDisplayCurrency = createLocalStorageStateHook<TFxCode | null>(
  'display-currency',
  null
)

function useDisplayCurrency() {
  const userCurrency = userModel.useUserCurrency()
  const [savedCurrency, setSavedCurrency] = useSavedDisplayCurrency()
  const currency = savedCurrency || userCurrency
  return [currency, setSavedCurrency] as [TFxCode, typeof setSavedCurrency]
}

const useToDisplay = (month: TISOMonth) => {
  const rates = balances.useRates()[month].rates
  const [displayCurrency] = useDisplayCurrency()
  const converter = useCallback(
    (amount: TFxAmount) => convertFx(amount, displayCurrency, rates),
    [displayCurrency, rates]
  )
  return converter
}

export const displayCurrency = {
  useDisplayCurrency,
  useToDisplay,
}
