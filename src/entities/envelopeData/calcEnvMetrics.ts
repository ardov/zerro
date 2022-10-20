import type {
  ById,
  TTransaction,
  TEnvelopeId,
  TFxAmount,
  TISOMonth,
  ByMonth,
  TFxCode,
} from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { addFxAmount, convertFx } from '@shared/helpers/money'
import { TFxRateData } from '@entities/fxRate'
import { TEnvelope } from '@entities/envelope'
import { TMonthActivity } from './parts/activity'

type TEnvMetrics = {
  id: TEnvelopeId
  currency: TFxCode
  transactions: TTransaction[]
  // Self metrics
  selfLeftover: TFxAmount
  selfBudgeted: TFxAmount
  selfActivity: TFxAmount
  selfAvailable: TFxAmount
  // Children metrics
  childrenLeftover: TFxAmount
  childrenBudgeted: TFxAmount
  childrenActivity: TFxAmount
  childrenSurplus: TFxAmount // Positive balances
  childrenOverspend: TFxAmount // Negative balances
  // Total metrics
  totalLeftover: TFxAmount
  totalBudgeted: TFxAmount
  totalActivity: TFxAmount
  totalAvailable: TFxAmount
}

export function calcEnvMetrics(
  monthList: TISOMonth[],
  envelopes: ById<TEnvelope>,
  activity: ByMonth<TMonthActivity>,
  budgets: ByMonth<Record<TEnvelopeId, number>>,
  rates: ByMonth<TFxRateData>
) {
  const result: Record<TISOMonth, ById<TEnvMetrics>> = {}

  const children = keys(envelopes).filter(id => envelopes[id].parent)
  const parents = keys(envelopes).filter(id => !envelopes[id].parent)
  let prevMetrics = {} as ById<TEnvMetrics>

  monthList.forEach(month => {
    let metrics = {} as ById<TEnvMetrics>
    children.forEach(id => {
      metrics[id] = calcEnv(id, month, metrics, prevMetrics)
    })
    parents.forEach(id => {
      metrics[id] = calcEnv(id, month, metrics, prevMetrics)
    })
    result[month] = metrics
    prevMetrics = metrics
  })

  return result

  function calcEnv(
    id: TEnvelopeId,
    month: TISOMonth,
    metrics: ById<TEnvMetrics>,
    prevMetrics: ById<TEnvMetrics>
  ) {
    const env = envelopes[id]
    const fx = env.currency
    const envActivity = activity?.[month]?.envelopes?.[id] || {}
    const budgetedValue = budgets?.[month]?.[id] || 0

    // Children metrics
    const childrenLeftover = env.children.reduce(
      (sum, id) => addFxAmount(metrics[id].selfLeftover, sum),
      {}
    )
    const childrenBudgeted = env.children.reduce(
      (sum, id) => addFxAmount(metrics[id].selfBudgeted, sum),
      {}
    )
    const childrenActivity = env.children.reduce(
      (sum, id) => addFxAmount(metrics[id].selfActivity, sum),
      {}
    )
    const childrenSurplus = env.children.reduce((sum, id) => {
      const { selfAvailable, currency } = metrics[id]
      if (selfAvailable[currency] > 0) return addFxAmount(selfAvailable, sum)
      return sum
    }, {})
    const childrenOverspend = env.children.reduce((sum, id) => {
      const { selfAvailable, currency } = metrics[id]
      if (selfAvailable[currency] < 0) return addFxAmount(selfAvailable, sum)
      return sum
    }, {})

    // Self metrics
    const selfLeftover = prevMetrics[id]?.selfAvailable || zero(fx)
    const selfBudgeted = { [fx]: budgetedValue }
    const selfActivity = envActivity?.activity || zero(fx)
    const selfAvailableRaw = addFxAmount(
      selfLeftover,
      selfBudgeted,
      selfActivity,
      childrenOverspend
    )
    const selfAvailable = {
      [fx]: convertFx(selfAvailableRaw, fx, rates[month].rates),
    }

    const res: TEnvMetrics = {
      id,
      currency: fx,
      transactions: envActivity?.transactions || [],

      selfLeftover,
      selfBudgeted,
      selfActivity,
      selfAvailable,

      childrenLeftover,
      childrenBudgeted,
      childrenActivity,
      childrenSurplus,
      childrenOverspend,

      totalLeftover: addFxAmount(selfLeftover, childrenLeftover),
      totalBudgeted: addFxAmount(selfBudgeted, childrenBudgeted),
      totalActivity: addFxAmount(selfActivity, childrenActivity),
      totalAvailable: addFxAmount(selfAvailable, childrenSurplus),
    }
    return res
  }
}

function zero(fx: TFxCode): TFxAmount {
  return { [fx]: 0 }
}
