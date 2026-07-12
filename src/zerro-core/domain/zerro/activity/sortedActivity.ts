import { keys } from '../../shared/keys'
import type { ByMonth } from '../../shared/types'
import type { TFxAmount } from '../../shared/money'
import { EnvType, envId, TEnvelopeId } from '../envelope-id'
import type { TFxConverter } from '../fx-rates'
import { EnvActivity, TRawActivityNode } from './rawActivity'

export enum TrFilterMode {
  GeneralIncome = 'generalIncome',
  Envelope = 'envelope',
  Income = 'income',
  Outcome = 'outcome',
  All = 'All',
}

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
  total: EnvActivity
  income?: EnvActivity
  outcome?: EnvActivity
  keepIncome?: boolean
}

export type TSortedActivity = {
  incomes: TSortedActivityNode[]
  outcomes: TSortedActivityNode[]
  transfers: TSortedActivityNode[]
  debts: TSortedActivityNode[]
  incomesTotal: EnvActivity
  outcomesTotal: EnvActivity
  transfersTotal: EnvActivity
  debtsTotal: EnvActivity
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
          income,
          outcome,
          keepIncome,
          trMode: TrFilterMode.Envelope,
          total: EnvActivity.merge(income, outcome),
        }
        const value = toValue(envInfo.total.total)
        if (value > 0) node.incomes.push(envInfo)
        if (value <= 0) node.outcomes.push(envInfo)
        return
      }

      if (income) {
        node.incomes.push({
          id,
          total: income,
          income,
          keepIncome,
          trMode: TrFilterMode.GeneralIncome,
        })
      }
      if (outcome) {
        node.outcomes.push({
          id,
          total: outcome,
          outcome,
          keepIncome,
          trMode: TrFilterMode.Envelope,
        })
      }
    })

    if (toValue(internal.total)) {
      node.transfers.push({
        id: 'transferFees',
        total: internal,
        trMode: TrFilterMode.All,
      })
    }

    keys(transfers).forEach(id => {
      const { income, outcome } = transfers[id]
      node.transfers.push({
        id,
        income,
        outcome,
        total: EnvActivity.merge(income, outcome),
        keepIncome: input.keepingEnvelopeIds.includes(id),
        trMode: TrFilterMode.All,
      })
    })

    keys(debts).forEach(id => {
      const { income, outcome } = debts[id]
      node.debts.push({
        id,
        income,
        outcome,
        total: EnvActivity.merge(income, outcome),
        keepIncome: input.keepingEnvelopeIds.includes(id),
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
    incomesTotal: new EnvActivity(),
    outcomesTotal: new EnvActivity(),
    transfersTotal: new EnvActivity(),
    debtsTotal: new EnvActivity(),
  }
}

function sumActivity(nodes: TSortedActivityNode[]): EnvActivity {
  return nodes.reduce(
    (sum, node) => EnvActivity.merge(sum, node.total),
    new EnvActivity()
  )
}
