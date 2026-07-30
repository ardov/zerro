import { addFxAmount, subFxAmount } from '../../zenmoney/model/money'
import type { ById, ByMonth } from '../../foundation/types'
import type { TFxAmount } from '../../zenmoney/model/money'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TFxConverter } from '../fx-rates'
import type { TActivityNode } from './activity'
import type { TEnvMetrics } from './envMetrics'

export type TToBeAssignedState = 'positive' | 'allocated' | 'negative'

export type TMonthTotals = {
  month: TISOMonth
  fundsStart: TFxAmount
  fundsChange: TFxAmount
  fundsEnd: TFxAmount
  transferFees: TFxAmount
  generalIncome: TFxAmount
  envActivity: TFxAmount
  assigned: TFxAmount
  positiveAssigned: TFxAmount
  available: TFxAmount
  assignedInFuture: TFxAmount
  freeFunds: TFxAmount
  toBeAssigned: TFxAmount
  toBeAssignedState: TToBeAssignedState
  overspend: TFxAmount
}

export type TBuildMonthTotalsInput = {
  monthList: TISOMonth[]
  currentFunds: TFxAmount
  activity: ByMonth<TActivityNode>
  envMetrics: ByMonth<ById<TEnvMetrics>>
  convertFx: TFxConverter
  currentMonth: TISOMonth
}

export function buildMonthTotals(
  input: TBuildMonthTotalsInput
): ByMonth<TMonthTotals> {
  const result: ByMonth<TMonthTotals> = {}
  const monthListReversed = [...input.monthList].reverse()

  let prev = monthListReversed[0]
  monthListReversed.forEach((month, index) => {
    const toValue = (amount: TFxAmount) => input.convertFx(amount, 'USD', month)
    const isFuture = month > input.currentMonth
    const isCurrent = month === input.currentMonth
    const prevMonth = result[prev] || ({} as Partial<TMonthTotals>)

    if (index === 0) {
      console.assert(isFuture || isCurrent, 'Last month is in the past')
    }

    const fundsEnd =
      isFuture || isCurrent ? input.currentFunds : prevMonth.fundsStart || {}
    const fundsChange = input.activity[month]?.total || {}
    const fundsStart = subFxAmount(fundsEnd, fundsChange)

    const transferFees = input.activity[month]?.transferFees.total || {}
    const generalIncome = input.activity[month]?.generalIncome.total || {}
    const envActivity = input.activity[month]?.envActivity.total || {}
    console.assert(
      isSameFxAmount(
        fundsChange,
        addFxAmount(transferFees, generalIncome, envActivity)
      ),
      'Total change is not equal to sum of transfers + income + env activity'
    )

    let positiveAssigned = {} as TFxAmount
    let assigned = {} as TFxAmount
    let available = {} as TFxAmount
    let overspend = {} as TFxAmount

    Object.values(input.envMetrics[month]).forEach(metrics => {
      if (metrics.parent) return

      const { totalAssigned, totalAvailable, selfAvailable } = metrics
      assigned = addFxAmount(assigned, totalAssigned)
      available = addFxAmount(available, totalAvailable)

      if (toValue(totalAssigned) > 0) {
        positiveAssigned = addFxAmount(positiveAssigned, totalAssigned)
      }

      if (toValue(selfAvailable) < 0) {
        overspend = addFxAmount(overspend, selfAvailable)
      }
    })

    const assignedInFuture = addFxAmount(
      prevMonth.positiveAssigned || {},
      prevMonth.assignedInFuture || {}
    )
    const freeFunds = subFxAmount(fundsEnd, available)
    const toBeAssignedInfo = calcToBeAssigned(
      freeFunds,
      assignedInFuture,
      toValue
    )

    result[month] = {
      month,
      fundsStart,
      fundsChange,
      fundsEnd,
      transferFees,
      generalIncome,
      envActivity,
      assigned,
      positiveAssigned,
      available,
      assignedInFuture,
      freeFunds,
      toBeAssigned: toBeAssignedInfo.value,
      toBeAssignedState: toBeAssignedInfo.state,
      overspend,
    }
    prev = month
  })

  return result
}

function calcToBeAssigned(
  freeNow: TFxAmount,
  needForFuture: TFxAmount,
  toValue: (amount: TFxAmount) => number
): { value: TFxAmount; state: TToBeAssignedState } {
  if (toValue(freeNow) < 0) {
    return { value: freeNow, state: 'negative' }
  }
  const withFuture = subFxAmount(freeNow, needForFuture)
  if (toValue(withFuture) > 0) {
    return { value: withFuture, state: 'positive' }
  }
  return { value: {}, state: 'allocated' }
}

function isSameFxAmount(left: TFxAmount, right: TFxAmount): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const key of keys) {
    if (left[key] !== right[key]) return false
  }
  return true
}
