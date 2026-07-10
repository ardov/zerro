import { v1 as uuidv1 } from 'uuid'
import type { AppThunk, RootState } from 'store'
import { applyClientPatch } from 'store/data'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import {
  compilePatchEnvelope,
  compileSetBudget,
  compileSetGoal,
  type TBudgetUpdate,
  type TEnvelopeDraft,
  type TEnvelopeId,
  type TGoal,
} from '../../zerro'
import { selectCoreEnvelopes } from './selectors'

/**
 * Serializable app commands. This envelope is the future outbox persistence
 * contract: once entries are stored, changing a payload shape requires a new
 * `v` and a migration, not an edit in place.
 *
 * `legacy.patch` wraps not-yet-migrated write paths so every client mutation
 * flows through one funnel; it carries the compiled patch as its payload.
 */
export type TAppCommand =
  | { v: 1; type: 'zerro.budget.set'; payload: TBudgetUpdate[] }
  | {
      v: 1
      type: 'zerro.goal.set'
      payload: { month: TISOMonth; id: TEnvelopeId; goal: TGoal | null }
    }
  | { v: 1; type: 'zerro.envelope.patch'; payload: TEnvelopeDraft[] }
  | { v: 1; type: 'legacy.patch'; payload: TNormalizedPatch }

export function compileAppCommand(
  state: RootState,
  command: TAppCommand,
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TNormalizedPatch {
  const data = state.data.current
  switch (command.type) {
    case 'zerro.budget.set':
      return compileSetBudget(data, command.payload, ctx)
    case 'zerro.goal.set': {
      const { month, id, goal } = command.payload
      return compileSetGoal(data, month, id, goal, ctx)
    }
    case 'zerro.envelope.patch':
      // Envelope drafts resolve against the adapter-prepared envelope read
      // model (populatedTags bridge); replay stays patch-based, so this
      // compile-time dependency does not leak into the outbox.
      return compilePatchEnvelope(
        data,
        selectCoreEnvelopes(state),
        command.payload,
        ctx
      )
    case 'legacy.patch':
      return command.payload
  }
}

// Late-bound lookups so Date.now/uuid mocks installed after module load work
const defaultCtx = { now: () => Date.now(), uuid: () => uuidv1() }

/**
 * The single write funnel: compiles a command against current state and
 * applies the resulting normalized patch. The replica step will replace the
 * internals with an outbox append; callers stay unchanged.
 */
export function executeCommand(command: TAppCommand): AppThunk {
  return (dispatch, getState) => {
    const patch = compileAppCommand(getState(), command, defaultCtx)
    if (isEmptyPatch(patch)) return
    dispatch(applyClientPatch(patch))
  }
}

function isEmptyPatch(patch: TNormalizedPatch): boolean {
  return Object.keys(patch).length === 0
}
