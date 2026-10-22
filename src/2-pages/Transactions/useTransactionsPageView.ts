import { useCallback, useEffect, useMemo } from 'react'
import type { TISODate } from '@/6-shared/types'
import { useDebouncedCallback } from '@/6-shared/hooks/useDebouncedCallback'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  patchTransactionsPage,
  saveTransactionsTopDate,
  selectTransactionsPageView,
  selectViewGeneration,
} from '@/store/view'
import type { TTransactionListView } from '@/3-widgets/transaction/TransactionList'
import type { core } from '@/zerro-core/redux'

const TOP_DATE_SAVE_DELAY = 400

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
  // The list reads the top date back only when it mounts, so it is saved once
  // scrolling settles, or when the page unmounts. A save made after the views
  // were reset carries the old generation and is ignored.
  const generation = useAppSelector(selectViewGeneration)
  const saveTopDate = useDebouncedCallback(
    (topDate: TISODate, savedGeneration: number) =>
      dispatch(
        saveTransactionsTopDate({ topDate, generation: savedGeneration })
      ),
    [dispatch],
    TOP_DATE_SAVE_DELAY
  )
  const onTopDateChange = useCallback(
    (topDate: TISODate) => saveTopDate(topDate, generation),
    [saveTopDate, generation]
  )
  useEffect(() => () => saveTopDate.flush(), [saveTopDate])

  return useMemo(
    () => ({
      query: transactionsPage.query,
      search: transactionsPage.search,
      restoredTopDate: transactionsPage.topDate,
      onQueryChange,
      onSearchChange,
      onTopDateChange,
    }),
    [onQueryChange, onSearchChange, onTopDateChange, transactionsPage]
  )
}
