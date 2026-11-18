import { endOfMonth } from 'date-fns'
import { parseDate, toISODate } from '@/6-shared/helpers/date'
import type { TISOMonth } from '@/6-shared/types'
import type { core } from '@/zerro-core/redux'

export function budgetDateFilter(month: TISOMonth) {
  return {
    kind: 'date' as const,
    from: toISODate(month),
    to: toISODate(endOfMonth(parseDate(month))),
  }
}

/** Older list history embedded the month in the activity. If the user already
 * picked a date range, restore that visible choice as the list's period. */
export function restoreBudgetDate(query: core.transactions.TTransactionQuery) {
  const activity = query.clauses.find(clause => clause.kind === 'activity')
  if (!activity?.month) return query
  const { month, ...envelope } = activity
  const hasDate = query.clauses.some(clause => clause.kind === 'date')
  return {
    clauses: query.clauses.flatMap(clause => {
      if (clause === activity)
        return hasDate ? [envelope] : [envelope, budgetDateFilter(month)]
      if (clause.kind === 'date' && !clause.from && !clause.to)
        return [budgetDateFilter(month)]
      return [clause]
    }),
  }
}
