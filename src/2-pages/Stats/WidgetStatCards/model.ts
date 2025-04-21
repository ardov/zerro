import { useMemo } from 'react'
import { Period } from '../shared/period'
import { useCashFlow } from '../WidgetCashflow/model'

export type StatSummary = {
  totalIncome: number
  totalOutcome: number
  totalSavings: number
  savingsRate: number
}

type CashFlowPoint = {
  income: number
  outcome: number
  date?: string
  month?: string
}

export function useStatSummary(period: Period): StatSummary {
  const points = useCashFlow(period) as CashFlowPoint[]

  return useMemo(() => {
    const totalIncome = points.reduce(
      (sum, point) => sum + point.income, 0
    )

    const totalOutcome = points.reduce(
      (sum, point) => sum + Math.abs(point.outcome), 0
    )

    const totalSavings = totalIncome - totalOutcome
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

    return {
      totalIncome,
      totalOutcome,
      totalSavings,
      savingsRate
    }
  }, [points])
}
