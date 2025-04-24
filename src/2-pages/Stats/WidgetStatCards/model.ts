import { useMemo } from 'react'
import { Period } from '../shared/period'
import { useCashFlow } from '../shared/cashflow'

export type StatSummary = {
  totalIncome: number
  totalOutcomeInBalance: number
  totalOutcomeOutOfBalance: number
  totalSavings: number
  savingsRate: number
}

export function useStatSummary(period: Period): StatSummary {
  const points = useCashFlow(period)

  return useMemo(() => {
    const totalIncome = points.reduce(
      (sum, point) => sum + point.income, 0
    )

    const totalOutcomeInBalance = points.reduce(
      (sum, point) => sum + Math.abs(point.outcomeInBalance), 0
    )

    const totalOutcomeOutOfBalance = points.reduce(
      (sum, point) => sum + Math.abs(point.outcomeOutOfBalance), 0
    )

    const totalSavings = totalIncome - totalOutcomeInBalance - totalOutcomeOutOfBalance
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

    return {
      totalIncome,
      totalOutcomeInBalance,
      totalOutcomeOutOfBalance,
      totalSavings,
      savingsRate
    }
  }, [points])
}
