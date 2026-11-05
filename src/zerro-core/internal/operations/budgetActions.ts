import {
  nextMonth,
  previousMonth,
  toISOMonth,
  isISOMonth,
} from '../domain/foundation/date'
import { round } from '../domain/foundation/numbers'
import type { TISOMonth } from '../domain/foundation/primitives'
import type { TDataStore } from '../domain/zenmoney/model/store'
import type { TFxCode } from '../domain/zenmoney/entities/instruments'
import type { TCoreContext } from '../../types'
import type { createProjectionGraph } from '../projections/graph'
import { buildEnvMetrics } from '../domain/zerro/activity/envMetrics'
import { buildGoals } from '../domain/zerro/goals/build'
import { goalType } from '../domain/zerro/goals/types'
import type { TEnvelopeId } from '../domain/zerro/envelope-id'

import {
  compileSetBudget,
  type TBudgetUpdate,
} from '../domain/zerro/budgets/commands'
import {
  getBudgetPresets,
  type TBudgetPresetKind,
} from '../domain/zerro/budgets/presets'

type TProjectionGraph = ReturnType<typeof createProjectionGraph>

export type TTotalAssignment = {
  month: TISOMonth
  id: TEnvelopeId
  amount: number
}
export type TMoveBudgetFunds = {
  month: TISOMonth
  from: TEnvelopeId | 'toBeAssigned'
  to: TEnvelopeId | 'toBeAssigned'
  money: { amount: number; currency: TFxCode }
}
export type TApplyBudgetPreset = {
  month: TISOMonth
  id: TEnvelopeId
  kind: TBudgetPresetKind
}

export function compileFundGoals(
  data: TDataStore,
  month: TISOMonth,
  ctx: TCoreContext,
  graph: TProjectionGraph
) {
  const draft = budgetDraft(data, ctx, [month], graph)
  // A parent's goal includes its children. Re-read goals after funding them.
  for (const childPass of [true, false]) {
    const goals = draft.goals()[month]
    const metrics = draft.metrics()[month]
    for (const goal of Object.values(goals)) {
      if (!!metrics[goal.id].parent !== childPass || !goal.needNow) continue
      if (goal.goal.type === goalType.TARGET_BALANCE && !goal.goal.end) continue
      const own = draft.own(month, goal.id)
      draft.setOwn(month, goal.id, own + goal.needNow)
    }
  }
  return draft.compile()
}

export function compileCoverOverspending(
  data: TDataStore,
  month: TISOMonth,
  ctx: TCoreContext,
  graph: TProjectionGraph
) {
  const draft = budgetDraft(data, ctx, [month], graph)
  for (const childPass of [true, false]) {
    for (const env of Object.values(draft.metrics()[month])) {
      if (!!env.parent !== childPass) continue
      const own = draft.own(month, env.id)
      // Unassigned children spend from their parent's pool.
      if (childPass && !own) continue
      const need = Math.max(-(env.selfAvailable[env.currency] || 0), 0)
      if (need) draft.setOwn(month, env.id, own + need)
    }
  }
  return draft.compile()
}

export function compileRestartBudget(
  data: TDataStore,
  month: TISOMonth,
  ctx: TCoreContext,
  graph: TProjectionGraph
) {
  const previous = toISOMonth(previousMonth(month))
  const draft = budgetDraft(data, ctx, [previous, month], graph)
  for (const target of [previous, month]) {
    for (const childPass of [true, false]) {
      for (const env of Object.values(draft.metrics()[target])) {
        if (!!env.parent !== childPass) continue
        const available = env.selfAvailable[env.currency] || 0
        if (available)
          draft.setOwn(target, env.id, draft.own(target, env.id) - available)
      }
    }
  }
  draft.clearFuture(month)
  return draft.compile()
}

export function compileCopyAssignments(
  data: TDataStore,
  input: { from: TISOMonth; to: TISOMonth },
  ctx: TCoreContext,
  graph: TProjectionGraph
) {
  const draft = budgetDraft(data, ctx, [input.from, input.to], graph)
  for (const env of Object.values(draft.metrics()[input.to])) {
    draft.setOwn(input.to, env.id, draft.own(input.from, env.id))
  }
  return draft.compile()
}

export function compileSetTotalAssigned(
  data: TDataStore,
  input: TTotalAssignment,
  ctx: TCoreContext,
  graph: TProjectionGraph
) {
  const draft = budgetDraft(data, ctx, [input.month], graph)
  draft.setTotal(input)
  return draft.compile()
}

export function compileMoveBudgetFunds(
  data: TDataStore,
  input: TMoveBudgetFunds,
  ctx: TCoreContext,
  graph: TProjectionGraph
) {
  const { month, from, to, money } = input
  requireAmount(money.amount)
  requireMonth(month)
  if (from === to || !money.amount) return { operations: [] }
  const draft = budgetDraft(data, ctx, [month], graph)
  for (const [id, sign] of [
    [from, -1],
    [to, 1],
  ] as const) {
    if (id === 'toBeAssigned') continue
    const env = draft.envelope(id)
    const change = draft.convert(
      { [money.currency]: sign * money.amount },
      env.currency,
      month
    )
    draft.setOwn(month, id, draft.own(month, id) + change)
  }
  return draft.compile()
}

export function compileApplyBudgetPreset(
  data: TDataStore,
  input: TApplyBudgetPreset,
  ctx: TCoreContext,
  graph: TProjectionGraph
) {
  const draft = budgetDraft(data, ctx, [input.month], graph)
  draft.envelope(input.id)
  const preset = getBudgetPresets(
    draft.metrics(),
    draft.goals(),
    draft.convert,
    input.month,
    input.id
  ).find(preset => preset.kind === input.kind)
  if (preset) draft.setTotal({ ...input, amount: preset.amount })
  return draft.compile()
}

/** Only assignments are writable. Intermediate calculations never enter the replica. */
function budgetDraft(
  data: TDataStore,
  ctx: TCoreContext,
  requestedMonths: TISOMonth[],
  graph: TProjectionGraph
) {
  requestedMonths.forEach(requireMonth)
  const original = graph.budgets(data)
  const budgets = { ...original }
  const copiedMonths = new Set<TISOMonth>()
  const envelopes = graph.envelopes(data)
  const convert = graph.convertFx(data)
  const originalMonths = graph.monthList(data)
  const range = [...originalMonths, ...requestedMonths].sort()
  const extended =
    range[0] !== originalMonths[0] || range.at(-1) !== originalMonths.at(-1)
  const monthList = extended ? ([] as TISOMonth[]) : originalMonths
  if (extended) {
    for (
      let month = range[0];
      month <= range[range.length - 1];
      month = toISOMonth(nextMonth(month))
    ) {
      monthList.push(month)
    }
  }
  let dirty = false
  let cachedMetrics: ReturnType<typeof buildEnvMetrics> | undefined
  let cachedGoals: ReturnType<typeof buildGoals> | undefined
  // Reuse the app's warm projections until a draft write or range extension.
  const metrics = () =>
    (cachedMetrics ??=
      !dirty && !extended
        ? graph.envMetrics(data)
        : buildEnvMetrics({
            monthList,
            envelopes,
            activity: graph.activity(data),
            budgets,
            convertFx: convert,
          }))
  const envelope = (id: TEnvelopeId) => {
    const env = envelopes[id]
    if (!env) throw new Error(`Envelope ${id} is not available`)
    return env
  }
  const own = (month: TISOMonth, id: TEnvelopeId) => budgets[month]?.[id] ?? 0
  const setOwn = (month: TISOMonth, id: TEnvelopeId, amount: number) => {
    requireAmount(amount)
    const value = round(amount)
    if (own(month, id) === value) return
    if (!copiedMonths.has(month)) {
      budgets[month] = { ...budgets[month] }
      copiedMonths.add(month)
    }
    budgets[month][id] = value
    dirty = true
    cachedMetrics = undefined
    cachedGoals = undefined
  }
  return {
    own,
    setOwn,
    metrics,
    envelope,
    convert,
    goals: () =>
      (cachedGoals ??=
        !dirty && !extended
          ? graph.goals(data)
          : buildGoals({
              rawGoals: graph.rawGoals(data),
              monthList,
              envMetrics: metrics(),
              sortedActivity: graph.sortedActivity(data),
              convertFx: convert,
            })),
    setTotal: ({ month, id, amount }: TTotalAssignment) => {
      requireAmount(amount)
      const env = envelope(id)
      setOwn(
        month,
        id,
        amount -
          convert(metrics()[month][id].childrenAssigned, env.currency, month)
      )
    },
    clearFuture: (month: TISOMonth) => {
      for (const [target, values] of Object.entries(budgets)) {
        if (target <= month) continue
        for (const id of Object.keys(values) as TEnvelopeId[]) {
          // Only existing envelopes participate in budget actions.
          if (!envelopes[id]) continue
          setOwn(target as TISOMonth, id, 0)
        }
      }
    },
    compile: () => {
      const updates: TBudgetUpdate[] = []
      for (const month of copiedMonths) {
        for (const id of Object.keys(budgets[month]) as TEnvelopeId[]) {
          const value = budgets[month][id]
          if (value !== (original[month]?.[id] ?? 0))
            updates.push({ month, id, value })
        }
      }
      return compileSetBudget(data, updates, ctx)
    },
  }
}

function requireAmount(amount: number) {
  if (!Number.isFinite(amount)) throw new Error('Budget amount must be finite')
}

function requireMonth(month: TISOMonth) {
  if (!isISOMonth(month)) throw new Error('Invalid budget month')
}
