import { useMemo } from 'react'
import type { TTransactionId } from '@/6-shared/types'
import { useDebounce } from '@/6-shared/hooks/useDebounce'
import { useLocalDay } from '@/6-shared/hooks/useLocalDay'
import { useAppSelector } from '@/store'
import { core } from '@/zerro-core/redux'

/** What a list shows for its filter and search, in list order. Shared with
 * the summary of that list, so the two can never count different rows. */
export function useListTransactions(
  transactionIds: TTransactionId[] | undefined,
  query: core.transactions.TTransactionQuery,
  search: string
) {
  const debouncedSearch = useDebounce(search, 300)
  const appliedQuery = useMemo<core.transactions.TTransactionQuery>(
    () => ({
      clauses: [
        ...query.clauses,
        ...(debouncedSearch
          ? [{ kind: 'search' as const, value: debouncedSearch }]
          : []),
      ],
    }),
    [debouncedSearch, query]
  )
  const transactionsById = useAppSelector(core.transactions.selectAll)
  const allTransactionIds = useAppSelector(core.transactions.selectIds)
  const context = useAppSelector(core.transactions.selectQueryContext)
  const today = useLocalDay()
  // Ordering depends on the data, not on each search or filter change.
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
  return useMemo(() => {
    const checker = core.transactions.compileQuery(appliedQuery, context, today)
    return ordered.filter(checker)
  }, [ordered, context, appliedQuery, today])
}
