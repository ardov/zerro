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
 * Serializable app commands. Once the outbox is persisted, a stored payload
 * shape becomes a contract: breaking changes mint a new type (for example
 * `zerro.budget.set@2`) or migrate eagerly at the storage boundary — the
 * persisted outbox gets its own schema version there.
 *
 * `legacy.patch` wraps not-yet-migrated write paths so every client mutation
 * flows through one funnel; it carries the compiled patch as its payload.
 */
export type TAppCommand =
  | { type: 'zerro.budget.set'; payload: TBudgetUpdate[] }
  | {
      type: 'zerro.goal.set'
      payload: { month: TISOMonth; id: TEnvelopeId; goal: TGoal | null }
    }
  | { type: 'zerro.envelope.patch'; payload: TEnvelopeDraft[] }
  | { type: 'legacy.patch'; payload: TNormalizedPatch }

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
