import { useCallback, useMemo } from 'react'
import type { TISODate } from '6-shared/types'
import { useAppDispatch, useAppSelector } from 'store'
import { patchTransactionsPage, selectTransactionsPageView } from 'store/view'
import type { TTransactionListView } from '3-widgets/transaction/TransactionList'
import type { core } from 'zerro-core/redux'

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
  const onTopDateChange = useCallback(
    (topDate: TISODate) => {
      dispatch(patchTransactionsPage({ topDate }))
    },
    [dispatch]
  )

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
