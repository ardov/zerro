import type { TEnvelope } from '../zerro/envelopes'
import { EnvType } from '../zerro/envelope-id'
import { envelopeVisibility } from '../zerro/envelope-meta'
import type { TEnvMetrics } from '../zerro/activity/envMetrics'
import {
  EnvActivity,
  type TRawActivityNode,
} from '../zerro/activity/rawActivity'
import type { TSortedActivity } from '../zerro/activity/sortedActivity'
import type { TGoalInfo } from '../zerro/goals/build'
import { goalType } from '../zerro/goals/types'

export function makeEnvelope(
  patch: Partial<TEnvelope> & { id: TEnvelope['id'] }
): TEnvelope {
  const { id, ...rest } = patch
  return {
    id,
    type: EnvType.Tag,
    entityId: 'entity',
    name: 'Envelope',
    originalName: 'Envelope',
    colorHex: null,
    children: [],
    parent: null,
    index: 0,
    indexRaw: undefined,
    visibility: envelopeVisibility.visible,
    group: 'Group',
    comment: '',
    currency: 'USD',
    keepIncome: false,
    carryNegatives: false,
    ...rest,
  }
}

export function makeRawActivityNode(
  patch: Partial<TRawActivityNode>
): TRawActivityNode {
  return {
    internal: new EnvActivity(),
    income: {},
    outcome: {},
    ...patch,
  }
}

export function makeEnvActivity(total: Record<string, number>): EnvActivity {
  const node = new EnvActivity()
  node.total = total
  return node
}

export function makeEnvMetrics(
  patch: Partial<TEnvMetrics> & { id: TEnvMetrics['id'] }
): TEnvMetrics {
  const { id, ...rest } = patch
  return {
    id,
    name: 'Envelope',
    parent: null,
    children: [],
    currency: 'USD',
    carryNegatives: false,
    selfTransactions: [],
    selfLeftover: {},
    selfBudgeted: {},
    selfActivity: {},
    selfAvailable: {},
    childrenTransactions: [],
    childrenLeftover: {},
    childrenBudgeted: {},
    childrenActivity: {},
    childrenSurplus: {},
    childrenOverspend: {},
    totalTransactions: [],
    totalLeftover: {},
    totalBudgeted: {},
    totalActivity: {},
    totalAvailable: {},
    ...rest,
  }
}

export function makeSortedActivity(): TSortedActivity {
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

export function makeGoalInfo(
  patch: Partial<TGoalInfo> & { id: TGoalInfo['id'] }
): TGoalInfo {
  const { id, ...rest } = patch
  return {
    id,
    goal: { type: goalType.MONTHLY, amount: 100 },
    month: '2026-01',
    currency: 'USD',
    progress: 0.5,
    needNow: 0,
    needStart: 0,
    targetBudget: 0,
    ...rest,
  }
}
