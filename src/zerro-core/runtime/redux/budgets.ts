import type { RootState } from '@/store'
import { createSelector } from '@reduxjs/toolkit'
import type { TISOMonth } from '../../internal/domain/foundation/primitives'
import type { TEnvelopeId } from '../../internal/domain/zerro/envelope-id'
import { getBudgetPresets } from '../../internal/domain/zerro/budgets/presets'
import { fromGraph, graph } from './graph'
import { selectData } from './state'
/** Write own assignments; child assignments are not included in these values. */
export { setBudget as setOwnAssigned, type TBudgetUpdate } from './commands'
export {
  fundGoals,
  coverOverspending,
  restart,
  copyAssignments,
  setTotalAssigned,
  moveFunds,
  applyPreset,
} from './budgetCommands'
export type { TBudgetPresetKind } from '../../internal/domain/zerro/budgets/presets'

export const selectRaw = (state: RootState) => selectData(state).budget

export const selectAll = fromGraph(graph.budgets)

export const selectPresets = createSelector(
  [
    fromGraph(graph.envMetrics),
    fromGraph(graph.goals),
    fromGraph(graph.convertFx),
    (_state: RootState, month: TISOMonth) => month,
    (_state: RootState, _month: TISOMonth, id: TEnvelopeId) => id,
  ],
  getBudgetPresets
)
