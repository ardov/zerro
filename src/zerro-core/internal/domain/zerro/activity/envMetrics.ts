import { keys } from '../../foundation/keys'
import { addFxAmount } from '../../zenmoney/model/money'
import type { ById, ByMonth } from '../../foundation/types'
import type { TFxAmount } from '../../zenmoney/model/money'
import type { TFxCode } from '../../zenmoney/entities/instruments'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TFxConverter } from '../fx-rates'
import type { TEnvelopeId } from '../envelope-id'
import type { TEnvelope } from '../envelopes'
import type { TActivityNode } from './activity'

export type TEnvMetrics = {
  id: TEnvelope['id']
  name: TEnvelope['name']
  parent: TEnvelope['parent']
  children: TEnvelope['children']
  currency: TEnvelope['currency']
  carryNegatives: TEnvelope['carryNegatives']

  selfTransactionCount: number
  selfLeftover: TFxAmount
  selfAssigned: TFxAmount
  selfActivity: TFxAmount
  selfAvailable: TFxAmount

  childrenTransactionCount: number
  childrenLeftover: TFxAmount
  childrenAssigned: TFxAmount
  childrenActivity: TFxAmount
  childrenSurplus: TFxAmount
  childrenOverspend: TFxAmount

  totalTransactionCount: number
  totalLeftover: TFxAmount
  totalAssigned: TFxAmount
  totalActivity: TFxAmount
  totalAvailable: TFxAmount
}

export type TBuildEnvMetricsInput = {
  monthList: TISOMonth[]
  envelopes: ById<TEnvelope>
  activity: ByMonth<TActivityNode>
  budgets: ByMonth<Record<TEnvelopeId, number>>
  convertFx: TFxConverter
}

export function buildEnvMetrics(
  input: TBuildEnvMetricsInput
): ByMonth<ById<TEnvMetrics>> {
  const result: ByMonth<ById<TEnvMetrics>> = {}

  const children = keys(input.envelopes).filter(
    id => input.envelopes[id].parent
  )
  const parents = keys(input.envelopes).filter(
    id => !input.envelopes[id].parent
  )
  let prevMetrics = {} as ById<TEnvMetrics>

  input.monthList.forEach(month => {
    const metrics = {} as ById<TEnvMetrics>
    children.forEach(id => {
      metrics[id] = calcEnv(input, id, month, metrics, prevMetrics)
    })
    parents.forEach(id => {
      metrics[id] = calcEnv(input, id, month, metrics, prevMetrics)
    })
    result[month] = metrics
    prevMetrics = metrics
  })

  return result
}

function calcEnv(
  input: TBuildEnvMetricsInput,
  id: TEnvelopeId,
  month: TISOMonth,
  metrics: ById<TEnvMetrics>,
  prevMetrics: ById<TEnvMetrics>
): TEnvMetrics {
  const { currency, children, name, carryNegatives, parent } =
    input.envelopes[id]

  let childrenLeftover = {} as TFxAmount
  let childrenAssigned = {} as TFxAmount
  let childrenActivity = {} as TFxAmount
  let childrenSurplus = {} as TFxAmount
  let childrenOverspend = {} as TFxAmount
  let childrenTransactionCount = 0

  children.forEach(id => {
    const child = metrics[id]
    childrenLeftover = addFxAmount(childrenLeftover, child.selfLeftover)
    childrenAssigned = addFxAmount(childrenAssigned, child.selfAssigned)
    childrenActivity = addFxAmount(childrenActivity, child.selfActivity)
    if (child.selfAvailable[child.currency] > 0) {
      childrenSurplus = addFxAmount(childrenSurplus, child.selfAvailable)
    } else {
      childrenOverspend = addFxAmount(childrenOverspend, child.selfAvailable)
    }
    childrenTransactionCount += child.selfTransactionCount
  })

  const selfLeftover = getLeftover(
    prevMetrics[id]?.selfAvailable,
    currency,
    carryNegatives
  )
  const selfAssigned = { [currency]: input.budgets?.[month]?.[id] || 0 }
  const envActivity = input.activity?.[month]?.envActivity?.byEnv?.[id]
  const selfActivity = envActivity?.total || {}
  const selfAvailableRaw = addFxAmount(
    selfLeftover,
    selfAssigned,
    selfActivity,
    childrenOverspend
  )
  const selfAvailable = {
    [currency]: input.convertFx(selfAvailableRaw, currency, month),
  }

  const selfTransactionCount = envActivity?.transactionCount || 0

  return {
    id,
    name,
    children,
    parent,
    currency,
    carryNegatives,

    selfTransactionCount,
    selfLeftover,
    selfAssigned,
    selfActivity,
    selfAvailable,

    childrenTransactionCount,
    childrenLeftover,
    childrenAssigned,
    childrenActivity,
    childrenSurplus,
    childrenOverspend,

    totalTransactionCount: selfTransactionCount + childrenTransactionCount,
    totalLeftover: addFxAmount(selfLeftover, childrenLeftover),
    totalAssigned: addFxAmount(selfAssigned, childrenAssigned),
    totalActivity: addFxAmount(selfActivity, childrenActivity),
    totalAvailable: addFxAmount(selfAvailable, childrenSurplus),
  }
}

function getLeftover(
  prevAvailable: TFxAmount | undefined,
  currency: TFxCode,
  carryNegatives: boolean
): TFxAmount {
  if (!prevAvailable) return { [currency]: 0 }
  if ((prevAvailable[currency] || 0) >= 0) return prevAvailable
  if (carryNegatives) return prevAvailable
  return { [currency]: 0 }
}
