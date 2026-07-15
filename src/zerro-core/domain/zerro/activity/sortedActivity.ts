import { keys } from '../../shared/keys'
import type { ByMonth } from '../../shared/types'
import { addFxAmount, type TFxAmount } from '../../shared/money'
import { EnvType, envId, TEnvelopeId } from '../envelope-id'
import type { TFxConverter } from '../fx-rates'
import { TrFilterMode } from '../transactions'
import { EnvActivity, TRawActivityNode } from './rawActivity'

export { TrFilterMode } from '../transactions'

type TActivityPair = { income?: EnvActivity; outcome?: EnvActivity }

type TActivityByType = {
  tags: Record<TEnvelopeId, TActivityPair>
  transfers: Record<TEnvelopeId, TActivityPair>
  debts: Record<TEnvelopeId, TActivityPair>
  internal: EnvActivity
}

export type TSortedActivityNode = {
  id: TEnvelopeId | 'transferFees'
  trMode: TrFilterMode
  total: TActivitySummary
}

export type TActivitySummary = Pick<EnvActivity, 'total' | 'transactionCount'>

export type TSortedActivity = {
  incomes: TSortedActivityNode[]
  outcomes: TSortedActivityNode[]
  transfers: TSortedActivityNode[]
  debts: TSortedActivityNode[]
  incomesTotal: TActivitySummary
  outcomesTotal: TActivitySummary
  transfersTotal: TActivitySummary
  debtsTotal: TActivitySummary
}

export type TBuildSortedActivityInput = {
  rawActivity: ByMonth<TRawActivityNode>
  keepingEnvelopeIds: TEnvelopeId[]
  convertFx: TFxConverter
}

export function buildSortedActivity(
  input: TBuildSortedActivityInput
): ByMonth<TSortedActivity> {
  const activityByType = buildActivityByType(input.rawActivity)
  const result: ByMonth<TSortedActivity> = {}

  keys(activityByType).forEach(month => {
    const { tags, transfers, debts, internal } = activityByType[month]
    const toValue = (amount: TFxAmount) => input.convertFx(amount, 'USD', month)
    const node = makeSortedActivity()

    keys(tags).forEach(id => {
      const { income, outcome } = tags[id]
      const keepIncome = input.keepingEnvelopeIds.includes(id)

      if (keepIncome) {
        const envInfo: TSortedActivityNode = {
          id,
          trMode: TrFilterMode.Envelope,
          total: mergeActivitySummary(income, outcome),
        }
        const value = toValue(envInfo.total.total)
        if (value > 0) node.incomes.push(envInfo)
        if (value <= 0) node.outcomes.push(envInfo)
        return
      }

      if (income) {
        node.incomes.push({
          id,
          total: summarizeActivity(income),
          trMode: TrFilterMode.GeneralIncome,
        })
      }
      if (outcome) {
        node.outcomes.push({
          id,
          total: summarizeActivity(outcome),
          trMode: TrFilterMode.Envelope,
        })
      }
    })

    if (toValue(internal.total)) {
      node.transfers.push({
        id: 'transferFees',
        total: summarizeActivity(internal),
        trMode: TrFilterMode.TransferFees,
      })
    }

    keys(transfers).forEach(id => {
      const { income, outcome } = transfers[id]
      node.transfers.push({
        id,
        total: mergeActivitySummary(income, outcome),
        trMode: TrFilterMode.All,
      })
    })

    keys(debts).forEach(id => {
      const { income, outcome } = debts[id]
      node.debts.push({
        id,
        total: mergeActivitySummary(income, outcome),
        trMode: TrFilterMode.All,
      })
    })

    const compare = (a: TSortedActivityNode, b: TSortedActivityNode) =>
      Math.abs(toValue(b.total.total)) - Math.abs(toValue(a.total.total))

    node.incomes.sort(compare)
    node.outcomes.sort(compare)
    node.transfers.sort(compare)
    node.debts.sort(compare)

    node.incomesTotal = sumActivity(node.incomes)
    node.outcomesTotal = sumActivity(node.outcomes)
    node.transfersTotal = sumActivity(node.transfers)
    node.debtsTotal = sumActivity(node.debts)

    result[month] = node
  })

  return result
}

function buildActivityByType(
  rawActivity: ByMonth<TRawActivityNode>
): ByMonth<TActivityByType> {
  const result: ByMonth<TActivityByType> = {}

  keys(rawActivity).forEach(month => {
    const { internal, income, outcome } = rawActivity[month]
    const node: TActivityByType = {
      tags: {},
      transfers: {},
      debts: {},
      internal,
    }

    keys(income).forEach(id => {
      const category = getEnvelopeCategory(id)
      node[category][id] = { income: income[id] }
    })
    keys(outcome).forEach(id => {
      const category = getEnvelopeCategory(id)
      if (node[category][id]) node[category][id].outcome = outcome[id]
      else node[category][id] = { outcome: outcome[id] }
    })

    result[month] = node
  })

  return result
}

function getEnvelopeCategory(id: TEnvelopeId): 'tags' | 'transfers' | 'debts' {
  const { type } = envId.parse(id)
  if (type === EnvType.Tag) return 'tags'
  if (type === EnvType.Account) return 'transfers'
  return 'debts'
}

function makeSortedActivity(): TSortedActivity {
  return {
    incomes: [],
    outcomes: [],
    transfers: [],
    debts: [],
    incomesTotal: emptyActivitySummary(),
    outcomesTotal: emptyActivitySummary(),
    transfersTotal: emptyActivitySummary(),
    debtsTotal: emptyActivitySummary(),
  }
}

function sumActivity(nodes: TSortedActivityNode[]): TActivitySummary {
  return nodes.reduce(
    (sum, node) => mergeActivitySummary(sum, node.total),
    emptyActivitySummary()
  )
}

function summarizeActivity(activity: EnvActivity): TActivitySummary {
  return {
    total: activity.total,
    transactionCount: activity.transactionCount,
  }
}

function mergeActivitySummary(
  activityA: TActivitySummary | undefined,
  activityB: TActivitySummary | undefined
): TActivitySummary {
  return {
    total: addFxAmount(activityA?.total || {}, activityB?.total || {}),
    transactionCount:
      (activityA?.transactionCount || 0) + (activityB?.transactionCount || 0),
  }
}

function emptyActivitySummary(): TActivitySummary {
  return { total: {}, transactionCount: 0 }
}
