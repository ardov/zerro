import { useCallback } from 'react'
import type { TDateDraft } from '../domain/zenmoney/primitives'
import type { TFxAmount } from '../domain/shared/money'
import { useAppSelector } from 'store'
import { useAppDispatch } from 'store'
import { setSavedCurrency } from 'store/displayCurrency'
import type { TFxCode } from '../domain/zenmoney/instruments/types'
import {
  selectCoreDebtAccountId,
  selectCoreDisplayConverter,
  selectCoreDisplayCurrency,
  selectCoreAccounts,
  selectCoreInBudgetAccounts,
  selectCorePopulatedAccounts,
  selectCoreSavingAccounts,
  selectCoreInstruments,
  selectCoreInstrumentsByCode,
  selectCoreInstCodeMap,
  selectCoreMerchants,
  selectCoreRootUserId,
  selectCoreUserCurrency,
  selectCoreUserInstrumentId,
  selectCoreUserSettings,
} from './selectors'
import { getTransactionType } from '../domain/zenmoney'

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

export function useCoreAccounts() {
  return useAppSelector(selectCoreAccounts)
}

export function useCorePopulatedAccounts() {
  return useAppSelector(selectCorePopulatedAccounts)
}

export function useCoreInBudgetAccounts() {
  return useAppSelector(selectCoreInBudgetAccounts)
}

export function useCoreSavingAccounts() {
  return useAppSelector(selectCoreSavingAccounts)
}

export function useCoreInstruments() {
  return useAppSelector(selectCoreInstruments)
}

export function useCoreInstrumentsByCode() {
  return useAppSelector(selectCoreInstrumentsByCode)
}

export function useCoreInstCodeMap() {
  return useAppSelector(selectCoreInstCodeMap)
}

export function useCoreMerchants() {
  return useAppSelector(selectCoreMerchants)
}

export function useCoreRootUserId() {
  return useAppSelector(selectCoreRootUserId)
}

export function useCoreUserCurrency() {
  return useAppSelector(selectCoreUserCurrency)
}

export function useCoreUserInstrumentId() {
  return useAppSelector(selectCoreUserInstrumentId)
}

export function useCoreUserSettings() {
  return useAppSelector(selectCoreUserSettings)
}
