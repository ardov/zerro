import { createSelector } from '@reduxjs/toolkit'
import { TFxAmount, TEnvelopeId, TISOMonth, TTransaction } from '@shared/types'
import { toISOMonth } from '@shared/helpers/date'
import { addFxAmount } from '@shared/helpers/money'
import { TSelector } from '@store'
import {
  getBudgetChanges,
  TBudgetChange,
  trDirection,
} from './getBudgetChanges'
import { getMonthList } from './monthList'
import { withPerf } from '@shared/helpers/performance'

type TTotalNode = {
  total: TFxAmount
  totalIncome: TFxAmount
  totalOutcome: TFxAmount

  trend: TFxAmount[]
  trendIncome: TFxAmount[]
  trendOutcome: TFxAmount[]

  trAll: TTransaction[]
  trIncome: TTransaction[]
  trOutcome: TTransaction[]
}

export type TMonthChange = {
  date: TISOMonth
  sum: TTotalNode
  transferFees: {
    total: TFxAmount
    trend: TFxAmount[]
  }
  byEnvelope: {
    [id: TEnvelopeId]: TTotalNode
  }
}

export const getTotalChanges: TSelector<Record<TISOMonth, TMonthChange>> =
  createSelector(
    [getBudgetChanges, getMonthList],
    withPerf('getTotalChanges', (changes, months) => {
      const result: Record<TISOMonth, TMonthChange> = {}

      months.forEach(date => {
        result[date] ??= makeMonthNode(date)
      })

      changes.forEach(ch => {
        const date = toISOMonth(ch.date)
        addToTotalNode(result[date].sum, ch)
        if (ch.envelope) {
          result[date].byEnvelope[ch.envelope] ??= makeTotalNode()
          addToTotalNode(result[date].byEnvelope[ch.envelope], ch)
          return
        } else {
          const day = new Date(ch.date).getDate() - 1
          result[date].transferFees.total = addFxAmount(
            result[date].transferFees.total,
            ch.diff
          )
          result[date].transferFees.trend[day] = addFxAmount(
            result[date].transferFees.trend[day],
            ch.diff
          )
        }
      })

      return result
    })
  )

function makeMonthNode(date: TISOMonth): TMonthChange {
  return {
    date,
    sum: makeTotalNode(),
    transferFees: {
      total: {},
      trend: makeMonthlyTrend(),
    },
    byEnvelope: {},
  }
}
function makeTotalNode(): TTotalNode {
  return {
    total: {},
    totalIncome: {},
    totalOutcome: {},
    trend: makeMonthlyTrend(),
    trendIncome: makeMonthlyTrend(),
    trendOutcome: makeMonthlyTrend(),
    trAll: [],
    trIncome: [],
    trOutcome: [],
  }
}
function makeMonthlyTrend(): TFxAmount[] {
  return new Array(31).fill({})
}

function addToTotalNode(node: TTotalNode, ch: TBudgetChange) {
  const day = new Date(ch.date).getDate() - 1

  node.total = addFxAmount(node.total, ch.diff)
  node.trend[day] = addFxAmount(node.trend[day], ch.diff)
  node.trAll.push(ch.transaction)

  if (ch.direction === trDirection.income) {
    node.totalIncome = addFxAmount(node.totalIncome, ch.diff)
    node.trIncome.push(ch.transaction)
    node.trendIncome[day] = addFxAmount(node.trendIncome[day], ch.diff)
  }

  if (ch.direction === trDirection.outcome) {
    node.totalOutcome = addFxAmount(node.totalOutcome, ch.diff)
    node.trOutcome.push(ch.transaction)
    node.trendOutcome[day] = addFxAmount(node.trendOutcome[day], ch.diff)
  }
}
