import { createSelector } from '@reduxjs/toolkit'
import { useCallback } from 'react'
import { getSavedCurrency } from 'store/displayCurrency'
import { useAppDispatch, useAppSelector } from 'store'
import type { TDateDraft } from '../domain/zenmoney/primitives'
import type { TFxAmount } from '../domain/shared/money'
import type { TFxCode } from '../domain/zenmoney/instruments/types'
import { setSavedCurrency } from 'store/displayCurrency'
import { convertBalancesToDisplay } from '../domain/zenmoney'
import * as balances from './balances'
import * as fxRates from './fxRates'
import * as users from './users'

export { selectConvertFx } from './fxRates'
export const selectDisplayCurrency = createSelector(
  [getSavedCurrency, users.selectCurrency],
  (savedCurrency, userCurrency) => savedCurrency || userCurrency
)
export const selectDisplayConverter = createSelector(
  [fxRates.selectConvertFx, selectDisplayCurrency],
  (convert, currency) =>
    (
      amount: Parameters<typeof convert>[0],
      date: Parameters<typeof convert>[2]
    ) =>
      convert(amount, currency, date)
)
export const selectDisplayBalancesByDate = createSelector(
  [balances.selectByDate, selectDisplayConverter],
  convertBalancesToDisplay
)
export const useDisplayCurrency = () => {
  const currency = useAppSelector(selectDisplayCurrency)
  const dispatch = useAppDispatch()
  const setCurrency = useCallback(
    (next: TFxCode) => dispatch(setSavedCurrency(next)),
    [dispatch]
  )
  return [currency, setCurrency] as const
}
export function useToDisplay(defaultDate: TDateDraft | 'current') {
  const convert = useAppSelector(selectDisplayConverter)
  return useCallback(
    (amount: TFxAmount, date: TDateDraft | 'current' = defaultDate) =>
      convert(amount, date),
    [convert, defaultDate]
  )
}
