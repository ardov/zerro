import { createSelector } from '@reduxjs/toolkit'
import type {
  ById,
  TTransaction,
  TFxAmount,
  TISOMonth,
  ByMonth,
  TFxCode,
} from '@shared/types'
import { keys } from '@shared/helpers/keys'
import { addFxAmount, convertFx } from '@shared/helpers/money'
import { withPerf } from '@shared/helpers/performance'
import { TSelector } from '@store/index'

import { envelopeModel, TEnvelope, TEnvelopeId } from '@entities/envelope'
import { budgetModel } from '@entities/budget'
import { TFxRateData } from '@entities/currency/fxRate'
import { getMonthList } from './1 - monthList'
import { getRatesByMonth } from './2 - rates'
import { getActivity, TActivityNode } from './2 - activity'

export type TEnvMetrics = {
  id: TEnvelope['id']
  name: TEnvelope['name']
  parent: TEnvelope['parent']
  children: TEnvelope['children']
  currency: TEnvelope['currency']
  carryNegatives: TEnvelope['carryNegatives']

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

export const getEnvMetrics: TSelector<ByMonth<ById<TEnvMetrics>>> =
  createSelector(
    [
      getMonthList,
      envelopeModel.getEnvelopes,
      getActivity,
      budgetModel.get,
      getRatesByMonth,
    ],
    withPerf('🖤 getEnvMetrics', calcEnvMetrics)
  )

function calcEnvMetrics(
  monthList: TISOMonth[],
  envelopes: ById<TEnvelope>,
  activity: ByMonth<TActivityNode>,
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
    const { currency, children, name, carryNegatives, parent } = envelopes[id]

    // Placeholders for children metrics
    let childrenLeftover = {} as TFxAmount
    let childrenBudgeted = {} as TFxAmount
    let childrenActivity = {} as TFxAmount
    let childrenSurplus = {} as TFxAmount
    let childrenOverspend = {} as TFxAmount

    // Fill children metrics
    children.forEach(id => {
      const ch = metrics[id]
      childrenLeftover = addFxAmount(childrenLeftover, ch.selfLeftover)
      childrenBudgeted = addFxAmount(childrenBudgeted, ch.selfBudgeted)
      childrenActivity = addFxAmount(childrenActivity, ch.selfActivity)
      if (ch.selfAvailable[ch.currency] > 0) {
        childrenSurplus = addFxAmount(childrenSurplus, ch.selfAvailable)
      } else {
        childrenOverspend = addFxAmount(childrenOverspend, ch.selfAvailable)
      }
    })

    // Self metrics
    const selfLeftover = getLeftover(
      prevMetrics[id]?.selfAvailable,
      currency,
      carryNegatives
    )
    const selfBudgeted = { [currency]: budgets?.[month]?.[id] || 0 }
    const selfActivity =
      activity?.[month]?.envActivity?.byEnv?.[id]?.total || {}
    const selfAvailableRaw = addFxAmount(
      selfLeftover,
      selfBudgeted,
      selfActivity,
      childrenOverspend
    )
    const selfAvailable = {
      [currency]: convertFx(selfAvailableRaw, currency, rates[month].rates),
    }

    const transactions =
      activity?.[month]?.envActivity?.byEnv?.[id]?.transactions || []

    const res: TEnvMetrics = {
      id,
      name,
      children,
      parent,
      currency,
      transactions,
      carryNegatives,

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

/** Create zero TFxAmount */
function zero(fx: TFxCode): TFxAmount {
  return { [fx]: 0 }
}

/** Returns leftover depending on envelope settings */
function getLeftover(
  prevAvailable: TFxAmount | undefined,
  currency: TFxCode,
  carryNegatives: boolean
): TFxAmount {
  if (!prevAvailable) return zero(currency)
  if ((prevAvailable[currency] || 0) >= 0) return prevAvailable
  if (carryNegatives) return prevAvailable
  return zero(currency)
}
