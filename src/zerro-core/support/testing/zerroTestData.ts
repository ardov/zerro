import {
  EnvActivity,
  EnvType,
  envelopeVisibility,
  goalType,
  type TEnvelope,
  type TEnvMetrics,
  type TGoalInfo,
  type TRawActivityNode,
  type TSortedActivity,
} from '../../internal/domain/zerro'

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
    selfTransactionCount: 0,
    selfLeftover: {},
    selfAssigned: {},
    selfActivity: {},
    selfAvailable: {},
    childrenTransactionCount: 0,
    childrenLeftover: {},
    childrenAssigned: {},
    childrenActivity: {},
    childrenSurplus: {},
    childrenOverspend: {},
    totalTransactionCount: 0,
    totalLeftover: {},
    totalAssigned: {},
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
    incomesTotal: { total: {}, transactionCount: 0 },
    outcomesTotal: { total: {}, transactionCount: 0 },
    transfersTotal: { total: {}, transactionCount: 0 },
    debtsTotal: { total: {}, transactionCount: 0 },
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
