import { useCallback, useEffect, useMemo } from 'react'
import type { TISODate, TTransactionId } from '@/6-shared/types'
import type { TTransactionListView } from '../transaction/TransactionList'
import { useDebouncedCallback } from '@/6-shared/hooks/useDebouncedCallback'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

export type TransactionListViewState = {
  query: core.transactions.TTransactionQuery
  search: string
  checked: TTransactionId[]
  topDate: TISODate | null
  scrollOffset: number | null
}

type ListValue = {
  initialQuery?: core.transactions.TTransactionQuery
  view?: TransactionListViewState
}

function initialView(value: ListValue): TransactionListViewState {
  return (
    value.view ?? {
      query: {
        clauses:
          value.initialQuery?.clauses.filter(
            clause => clause.kind !== 'search'
          ) ?? [],
      },
      search:
        value.initialQuery?.clauses.find(clause => clause.kind === 'search')
          ?.value ?? '',
      checked: [],
      topDate: null,
      scrollOffset: null,
    }
  )
}

/** One serializable view belongs to one list opening. Scrolling only replaces
 * its history value after settling; navigation and reload flush the last offset. */
export function useTransactionListView<T extends ListValue>(
  value: T | undefined,
  setValue: (update: (previous: T) => T) => void
) {
  const state = useMemo(() => initialView(value ?? {}), [value])
  const patch = useCallback(
    (update: Partial<TransactionListViewState>) => {
      setValue(previous => ({
        ...previous,
        view: { ...initialView(previous), ...update },
      }))
    },
    [setValue]
  )
  const saveScroll = useDebouncedCallback(
    (topDate: TISODate, scrollOffset: number) => {
      patch({ topDate, scrollOffset })
    },
    [patch],
    200
  )
  useEffect(() => {
    const flush = () => saveScroll.flush()
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [saveScroll])
  const transactions = useAppSelector(core.transactions.selectAll)
  useEffect(() => {
    const checked = state.checked.filter(id => transactions[id])
    if (checked.length !== state.checked.length) patch({ checked })
  }, [state.checked, transactions, patch])
  const view = useMemo<TTransactionListView>(
    () => ({
      query: state.query,
      search: state.search,
      checked: state.checked,
      restoredTopDate: state.topDate,
      restoredScrollOffset: state.scrollOffset,
      onQueryChange: query => patch({ query }),
      onSearchChange: search => patch({ search }),
      onCheckedChange: checked => patch({ checked }),
      onScrollChange: saveScroll,
    }),
    [state, patch, saveScroll]
  )
  return { view, flushScroll: saveScroll.flush }
}
