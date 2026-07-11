import { useCallback } from 'react'
import type { TDateDraft } from '../../zenmoney/primitives'
import type { TFxAmount } from '../../shared/money'
import { useAppSelector } from 'store'
import { useAppDispatch } from 'store'
import { setSavedCurrency } from 'store/displayCurrency'
import type { TFxCode } from '../../zenmoney/instruments/types'
import {
  selectCoreDebtAccountId,
  selectCoreDisplayConverter,
  selectCoreDisplayCurrency,
} from './selectors'
import { getTransactionType } from '../../zenmoney'

export function useCoreToDisplay(defaultDate: TDateDraft | 'current') {
  const convert = useAppSelector(selectCoreDisplayConverter)
  return useCallback(
    (amount: TFxAmount, date: TDateDraft | 'current' = defaultDate) =>
      convert(amount, date),
    [convert, defaultDate]
  )
}

export function useCoreDisplayCurrency() {
  const currency = useAppSelector(selectCoreDisplayCurrency)
  const dispatch = useAppDispatch()
  const setCurrency = useCallback(
    (next: TFxCode) => dispatch(setSavedCurrency(next)),
    [dispatch]
  )
  return [currency, setCurrency] as const
}

export function useCoreTransactionType() {
  const debtAccountId = useAppSelector(selectCoreDebtAccountId)
  return useCallback(
    (transaction: Parameters<typeof getTransactionType>[0]) =>
      getTransactionType(transaction, debtAccountId),
    [debtAccountId]
  )
}
