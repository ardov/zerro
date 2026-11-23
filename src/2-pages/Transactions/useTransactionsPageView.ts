import { useCallback, useEffect, useMemo } from 'react'
import type { TISODate, TTransactionId } from '@/6-shared/types'
import { useDebouncedCallback } from '@/6-shared/hooks/useDebouncedCallback'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  patchTransactionsPage,
  saveTransactionsScroll,
  selectTransactionsPageView,
  selectViewGeneration,
} from '@/store/view'
import type { TTransactionListView } from '@/3-widgets/transaction/TransactionList'
import type { core } from '@/zerro-core/redux'

const SCROLL_SAVE_DELAY = 400

export function useTransactionsPageView(): TTransactionListView {
  const dispatch = useAppDispatch()
  const transactionsPage = useAppSelector(selectTransactionsPageView)

  const onQueryChange = useCallback(
    (query: core.transactions.TTransactionQuery) => {
      dispatch(patchTransactionsPage({ query }))
    },
    [dispatch]
  )
  const onSearchChange = useCallback(
    (search: string) => {
      dispatch(patchTransactionsPage({ search }))
    },
    [dispatch]
  )
  const onCheckedChange = useCallback(
    (checked: TTransactionId[]) => {
      dispatch(patchTransactionsPage({ checked }))
    },
    [dispatch]
  )
  // Persist after scrolling settles or on unmount. The view generation rejects writes after a reset.
  const generation = useAppSelector(selectViewGeneration)
  const saveScroll = useDebouncedCallback(
    (topDate: TISODate, scrollOffset: number, savedGeneration: number) =>
      dispatch(
        saveTransactionsScroll({
          topDate,
          scrollOffset,
          generation: savedGeneration,
        })
      ),
    [dispatch],
    SCROLL_SAVE_DELAY
  )
  const onScrollChange = useCallback(
    (topDate: TISODate, scrollOffset: number) =>
      saveScroll(topDate, scrollOffset, generation),
    [saveScroll, generation]
  )
  useEffect(() => () => saveScroll.flush(), [saveScroll])

  return useMemo(
    () => ({
      query: transactionsPage.query,
      search: transactionsPage.search,
      restoredTopDate: transactionsPage.topDate,
      restoredScrollOffset: transactionsPage.scrollOffset,
      checked: transactionsPage.checked,
      onQueryChange,
      onSearchChange,
      onCheckedChange,
      onScrollChange,
    }),
    [
      onQueryChange,
      onSearchChange,
      onCheckedChange,
      onScrollChange,
      transactionsPage,
    ]
  )
}
