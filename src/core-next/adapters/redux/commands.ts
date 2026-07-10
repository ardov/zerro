import { v1 as uuidv1 } from 'uuid'
import type { AppThunk, RootState } from 'store'
import { applyClientPatch } from 'store/data'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import {
  compilePatchEnvelope,
  compileRenameEnvelope,
  compileSetEnvelopeColor,
  compileSetEnvelopeComment,
  compileUpdateEnvelopeSettings,
  compileSetBudget,
  compileSetGoal,
  type TBudgetUpdate,
  type TEnvelopeDraft,
  type TEnvelopeId,
  type TGoal,
  type TRenameEnvelopeInput,
  type TSetEnvelopeColorInput,
  type TSetEnvelopeCommentInput,
  type TUpdateEnvelopeSettingsInput,
} from '../../zerro'
import { getDomainEnvelopeGroup } from './envelopePresentation'
import {
  selectCoreEnvelopeLabels,
  selectCoreDomainEnvelopes,
  selectCoreEnvelopes,
} from './selectors'

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
  | { type: 'zerro.envelope.rename'; payload: TRenameEnvelopeInput }
  | { type: 'zerro.envelope.color.set'; payload: TSetEnvelopeColorInput }
  | { type: 'zerro.envelope.comment.set'; payload: TSetEnvelopeCommentInput }
  | {
      type: 'zerro.envelope.settings.update'
      payload: TUpdateEnvelopeSettingsInput
    }
  | { type: 'legacy.patch'; payload: TNormalizedPatch }

export function compileAppCommand(
  state: RootState,
  command: TAppCommand,
  ctx: TCoreContext
): TNormalizedPatch {
  const data = state.data.current
  switch (command.type) {
    case 'zerro.budget.set':
      return compileSetBudget(data, command.payload, ctx)
    case 'zerro.goal.set': {
      const { month, id, goal } = command.payload
      return compileSetGoal(data, month, id, goal, ctx)
    }
    case 'zerro.envelope.rename':
      return compileRenameEnvelope(data, command.payload, ctx)
    case 'zerro.envelope.color.set':
      return compileSetEnvelopeColor(data, command.payload, ctx)
    case 'zerro.envelope.comment.set':
      return compileSetEnvelopeComment(data, command.payload, ctx)
    case 'zerro.envelope.settings.update':
      return compileUpdateEnvelopeSettings(
        data,
        selectCoreDomainEnvelopes(state),
        normalizeEnvelopeSettings(state, command.payload),
        ctx
      )
    case 'zerro.envelope.patch': {
      const labels = selectCoreEnvelopeLabels()
      const drafts = command.payload.map(draft =>
        draft.group
          ? { ...draft, group: getDomainEnvelopeGroup(draft.group, labels) }
          : draft
      )
      return compilePatchEnvelope(
        data,
        selectCoreDomainEnvelopes(state),
        drafts,
        ctx
      )
    }
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

export function renameEnvelope(id: TEnvelopeId, name: string): AppThunk {
  return executeCommand({
    type: 'zerro.envelope.rename',
    payload: { id, name },
  })
}

export function setEnvelopeColor(
  id: TEnvelopeId,
  colorHex: string | null
): AppThunk {
  return executeCommand({
    type: 'zerro.envelope.color.set',
    payload: { id, colorHex },
  })
}

export function setEnvelopeComment(id: TEnvelopeId, comment: string): AppThunk {
  return executeCommand({
    type: 'zerro.envelope.comment.set',
    payload: { id, comment },
  })
}

export function updateEnvelopeSettings(
  input: TUpdateEnvelopeSettingsInput
): AppThunk {
  return executeCommand({
    type: 'zerro.envelope.settings.update',
    payload: input,
  })
}

function normalizeEnvelopeSettings(
  state: RootState,
  input: TUpdateEnvelopeSettingsInput
): TUpdateEnvelopeSettingsInput {
  const domain = selectCoreDomainEnvelopes(state)[input.id]
  const presented = selectCoreEnvelopes(state)[input.id]
  if (!domain || !presented) return input

  return {
    ...input,
    name:
      input.name === presented.originalName ? domain.originalName : input.name,
    colorHex:
      input.colorHex === presented.colorHex ? domain.colorHex : input.colorHex,
  }
}

function isEmptyPatch(patch: TNormalizedPatch): boolean {
  return Object.keys(patch).length === 0
}
