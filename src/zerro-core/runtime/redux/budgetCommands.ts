import type { TISOMonth } from '../../internal/domain/foundation/primitives'
import {
  compileFundGoals,
  compileCoverOverspending,
  compileRestartBudget,
  compileCopyAssignments,
  compileSetTotalAssigned,
  compileMoveBudgetFunds,
  compileApplyBudgetPreset,
  type TTotalAssignment,
  type TMoveBudgetFunds,
  type TApplyBudgetPreset,
} from '../../internal/operations/budgetActions'
import type { TBudgetPresetKind } from '../../internal/domain/zerro/budgets/presets'
import type { TCommandVerb } from '../../internal/operations/materialization'
import { executeReduxCommandWithStatus } from './executeCommand'
import { selectData } from './state'
import { graph } from './graph'

export function fundGoals(month: TISOMonth) {
  return executeReduxCommandWithStatus(
    (state, ctx) => compileFundGoals(selectData(state), month, ctx, graph),
    { label: { verb: 'budget-goals-funded' } }
  )
}

export function coverOverspending(month: TISOMonth) {
  return executeReduxCommandWithStatus(
    (state, ctx) =>
      compileCoverOverspending(selectData(state), month, ctx, graph),
    { label: { verb: 'budget-overspending-covered' } }
  )
}

export function restart(month: TISOMonth) {
  return executeReduxCommandWithStatus(
    (state, ctx) => compileRestartBudget(selectData(state), month, ctx, graph),
    { label: { verb: 'budget-restarted' } }
  )
}

export function copyAssignments(input: { from: TISOMonth; to: TISOMonth }) {
  return executeReduxCommandWithStatus(
    (state, ctx) =>
      compileCopyAssignments(selectData(state), input, ctx, graph),
    { label: { verb: 'budget-copied' } }
  )
}

/** Set the total in envelope currency; subtract current child assignments. */
export function setTotalAssigned(input: TTotalAssignment) {
  return executeReduxCommandWithStatus(
    (state, ctx) =>
      compileSetTotalAssigned(selectData(state), input, ctx, graph),
    { label: { verb: 'budget-set', args: { id: input.id } } }
  )
}

export function moveFunds(input: TMoveBudgetFunds) {
  return executeReduxCommandWithStatus(
    (state, ctx) =>
      compileMoveBudgetFunds(selectData(state), input, ctx, graph),
    { label: { verb: 'budget-funds-moved' } }
  )
}

const presetVerbs = {
  coverOverspending: 'budget-overspending-covered',
  releaseSurplus: 'budget-surplus-released',
  goalAmount: 'budget-goal-assigned',
  averageSpending: 'budget-average-spending-assigned',
  previousAssignment: 'budget-previous-assignment-set',
  previousSpending: 'budget-previous-spending-assigned',
  childrenAssigned: 'budget-children-assigned',
} as const satisfies Record<TBudgetPresetKind, TCommandVerb>

export function applyPreset(input: TApplyBudgetPreset) {
  return executeReduxCommandWithStatus(
    (state, ctx) =>
      compileApplyBudgetPreset(selectData(state), input, ctx, graph),
    { label: { verb: presetVerbs[input.kind], args: { id: input.id } } }
  )
}
