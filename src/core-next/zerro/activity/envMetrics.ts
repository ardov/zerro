import { keys } from '6-shared/helpers/keys'
import { addFxAmount } from '6-shared/helpers/money'
import type {
  ById,
  ByMonth,
  TDateDraft,
  TFxAmount,
  TFxCode,
  TISOMonth,
  TTransaction,
} from '6-shared/types'
import type { TEnvelopeId } from '../envelope-id'
import type { TEnvelope } from '../envelopes'
import type { TActivityNode } from './activity'

export type TFxConverter = (
  amount: TFxAmount,
  target: TFxCode,
  date: TDateDraft | 'current'
) => number

export type TEnvMetrics = {
  id: TEnvelope['id']
  name: TEnvelope['name']
  parent: TEnvelope['parent']
  children: TEnvelope['children']
  currency: TEnvelope['currency']
  carryNegatives: TEnvelope['carryNegatives']

  selfTransactions: TTransaction[]
  selfLeftover: TFxAmount
  selfBudgeted: TFxAmount
  selfActivity: TFxAmount
  selfAvailable: TFxAmount

  childrenTransactions: TTransaction[]
  childrenLeftover: TFxAmount
  childrenBudgeted: TFxAmount
  childrenActivity: TFxAmount
  childrenSurplus: TFxAmount
  childrenOverspend: TFxAmount

  totalTransactions: TTransaction[]
  totalLeftover: TFxAmount
  totalBudgeted: TFxAmount
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
  let childrenBudgeted = {} as TFxAmount
  let childrenActivity = {} as TFxAmount
  let childrenSurplus = {} as TFxAmount
  let childrenOverspend = {} as TFxAmount
  const childrenTransactions = [] as TTransaction[]

  children.forEach(id => {
    const child = metrics[id]
    childrenLeftover = addFxAmount(childrenLeftover, child.selfLeftover)
    childrenBudgeted = addFxAmount(childrenBudgeted, child.selfBudgeted)
    childrenActivity = addFxAmount(childrenActivity, child.selfActivity)
    if (child.selfAvailable[child.currency] > 0) {
      childrenSurplus = addFxAmount(childrenSurplus, child.selfAvailable)
    } else {
      childrenOverspend = addFxAmount(childrenOverspend, child.selfAvailable)
    }
    childrenTransactions.push(...child.selfTransactions)
  })

  const selfLeftover = getLeftover(
    prevMetrics[id]?.selfAvailable,
    currency,
    carryNegatives
  )
  const selfBudgeted = { [currency]: input.budgets?.[month]?.[id] || 0 }
  const envActivity = input.activity?.[month]?.envActivity?.byEnv?.[id]
  const selfActivity = envActivity?.total || {}
  const selfAvailableRaw = addFxAmount(
    selfLeftover,
    selfBudgeted,
    selfActivity,
    childrenOverspend
  )
  const selfAvailable = {
    [currency]: input.convertFx(selfAvailableRaw, currency, month),
  }

  const selfTransactions =
    input.activity?.[month]?.envActivity?.byEnv?.[id]?.transactions || []

  return {
    id,
    name,
    children,
    parent,
    currency,
    carryNegatives,

    selfTransactions,
    selfLeftover,
    selfBudgeted,
    selfActivity,
    selfAvailable,

    childrenTransactions,
    childrenLeftover,
    childrenBudgeted,
    childrenActivity,
    childrenSurplus,
    childrenOverspend,

    totalTransactions: [...selfTransactions, ...childrenTransactions],
    totalLeftover: addFxAmount(selfLeftover, childrenLeftover),
    totalBudgeted: addFxAmount(selfBudgeted, childrenBudgeted),
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
