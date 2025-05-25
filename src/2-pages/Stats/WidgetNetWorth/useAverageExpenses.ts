import { useMemo } from 'react'
import { GroupBy } from '6-shared/helpers/date'
import { useCashFlow, summarizeCashflow } from '../shared/cashflow'
import { Period } from '../shared/period'

/** Hook to get average monthly expenses */
export function useAverageExpenses(): number {
  const points = useCashFlow(Period.LastYear, GroupBy.Month)

  return useMemo(() => {
    const length = points.length
    if (!length) return 0
    const summary = summarizeCashflow(points)
    const avgMonthlyExpenses = summary.outcome / length
    return avgMonthlyExpenses
  }, [points])
}
