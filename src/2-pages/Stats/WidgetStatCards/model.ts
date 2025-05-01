import { Period } from '../shared/period'
import { useCashFlow } from '../shared/cashflow'
import { GroupBy } from "../../../6-shared/helpers/date";

export type StatSummary = {
  totalIncome: number
  totalOutcomeInBalance: number
  totalOutcomeOutOfBalance: number
  totalSavings: number
  savingsRate: number
}

export function useStatSummary(period: Period): StatSummary {
  const points = useCashFlow(period, GroupBy.Day)

  const {totalIncome, totalOutcomeInBalance, totalOutcomeOutOfBalance}
    = points.reduce((acc, point, index) => {
      // We skip the first point because we need to get the total
      // for the whole period, but not period + 1 day
      if (index === 0) return acc
      return {
        totalIncome: acc.totalIncome + point.income,
        totalOutcomeInBalance: acc.totalOutcomeInBalance + Math.abs(point.outcomeInBalance),
        totalOutcomeOutOfBalance: acc.totalOutcomeOutOfBalance + Math.abs(point.outcomeOutOfBalance)
      }
    },
    {totalIncome: 0, totalOutcomeInBalance: 0, totalOutcomeOutOfBalance: 0}
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
}
