import { useMemo, useState } from 'react'
import type { TTransactionId } from '@/6-shared/types'
import { useLocalDay } from '@/6-shared/hooks/useLocalDay'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'
import { makeDefaultClause, type Clause } from './TopBar/filterModel'
import type { FilterState } from './TopBar/filterSuggestions'

const quickFilterClauses: Clause[] = [
  makeDefaultClause('viewed'),
  { kind: 'tag', ids: ['null'] },
]

export type ListTransactions = ReturnType<typeof useListTransactions>

/** One instance owns the effective result used by both the list and its summary. */
export function useListTransactions(
  transactionIds: TTransactionId[] | undefined,
  applied: FilterState
) {
  const [preview, setPreview] = useState<FilterState | null>(null)
  const { query, search } = preview ?? applied
  const appliedQuery = useMemo<core.transactions.TTransactionQuery>(
    () => ({
      clauses: [
        ...query.clauses,
        ...(search ? [{ kind: 'search' as const, value: search }] : []),
      ],
    }),
    [search, query]
  )
  const transactionsById = useAppSelector(core.transactions.selectAll)
  const allTransactionIds = useAppSelector(core.transactions.selectIds)
  const context = useAppSelector(core.transactions.selectQueryContext)
  const today = useLocalDay()
  const ordered = useMemo(
    () =>
      (transactionIds || allTransactionIds)
        .map(id => transactionsById[id])
        .filter(
          (transaction): transaction is NonNullable<typeof transaction> =>
            !!transaction
        )
        .sort(core.transactions.compareTransactionDates),
    [transactionIds, allTransactionIds, transactionsById]
  )
  const quickFilters = useMemo(
    () =>
      quickFilterClauses
        .map(clause => {
          const matches = core.transactions.compileQuery(
            { clauses: [clause] },
            context
          )
          let count = 0
          for (const transaction of ordered) {
            if (matches(transaction)) count++
          }
          return { clause, count }
        })
        .filter(filter => filter.count > 0),
    [ordered, context]
  )
  const transactions = useMemo(() => {
    const checker = core.transactions.compileQuery(appliedQuery, context, today)
    return ordered.filter(checker)
  }, [ordered, context, appliedQuery, today])
  return {
    transactions,
    quickFilters,
    setPreview,
    previewing: preview !== null,
  }
}
