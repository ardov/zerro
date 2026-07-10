import { v1 as uuidv1 } from 'uuid'
import type { AppThunk, RootState } from 'store'
import { applyClientPatch } from 'store/data'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TCompiled, TCoreContext, TNormalizedPatch } from '../../types'
import {
  compileDeleteTransactions,
  compileDeleteTransactionsPermanently,
  compileRestoreTransaction,
  type TTransactionId,
} from '../../zenmoney'
import {
  compileApplyEnvelopeStructure,
  compileCreateEnvelope,
  compileRenameEnvelope,
  compileSetEnvelopeColor,
  compileSetEnvelopeComment,
  compileUpdateEnvelopeSettings,
  compileSetBudget,
  compileSetGoal,
  type TApplyEnvelopeStructureInput,
  type TBudgetUpdate,
  type TCreateEnvelopeInput,
  type TCreateEnvelopeReceipt,
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
  | { type: 'zerro.envelope.rename'; payload: TRenameEnvelopeInput }
  | { type: 'zerro.envelope.color.set'; payload: TSetEnvelopeColorInput }
  | { type: 'zerro.envelope.comment.set'; payload: TSetEnvelopeCommentInput }
  | {
      type: 'zerro.envelope.settings.update'
      payload: TUpdateEnvelopeSettingsInput
    }
  | { type: 'zerro.envelope.create'; payload: TCreateEnvelopeInput }
  | {
      type: 'zerro.envelope.structure.apply'
      payload: TApplyEnvelopeStructureInput
    }
  | { type: 'zenmoney.transaction.delete'; payload: { ids: TTransactionId[] } }
  | {
      type: 'zenmoney.transaction.delete.permanent'
      payload: { ids: TTransactionId[] }
    }
  | { type: 'zenmoney.transaction.restore'; payload: { id: TTransactionId } }
  | { type: 'legacy.patch'; payload: TNormalizedPatch }

export function compileAppCommand(
  state: RootState,
  command: TAppCommand,
  ctx: TCoreContext
): TNormalizedPatch {
  const result = compileAppCommandResult(state, command, ctx)
  return isCompiled(result) ? result.patch : result
}

function compileAppCommandResult(
  state: RootState,
  command: TAppCommand,
  ctx: TCoreContext
): TNormalizedPatch | TCompiled<unknown> {
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
    case 'zerro.envelope.create': {
      const labels = selectCoreEnvelopeLabels()
      return compileCreateEnvelope(
        data,
        {
          ...command.payload,
          group: command.payload.group
            ? getDomainEnvelopeGroup(command.payload.group, labels)
            : undefined,
        },
        ctx
      )
    }
    case 'zerro.envelope.structure.apply': {
      const labels = selectCoreEnvelopeLabels()
      const structure = command.payload.map(group => ({
        ...group,
        group: getDomainEnvelopeGroup(group.group, labels),
      }))
      return compileApplyEnvelopeStructure(
        data,
        selectCoreDomainEnvelopes(state),
        structure,
        ctx
      )
    }
    case 'zenmoney.transaction.delete':
      return compileDeleteTransactions(data, command.payload.ids, ctx)
    case 'zenmoney.transaction.delete.permanent':
      return compileDeleteTransactionsPermanently(
        data,
        command.payload.ids,
        ctx
      )
    case 'zenmoney.transaction.restore':
      return compileRestoreTransaction(data, command.payload.id, ctx)
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
export function executeCommand(command: TAppCommand): AppThunk<any> {
  return (dispatch, getState) => {
    const result = compileAppCommandResult(getState(), command, defaultCtx)
    const patch = isCompiled(result) ? result.patch : result
    if (!isEmptyPatch(patch)) dispatch(applyClientPatch(patch))
    return isCompiled(result) ? result.receipt : undefined
  }
}

export function createEnvelope(
  input: TCreateEnvelopeInput
): AppThunk<TEnvelopeId> {
  const execute = executeCommand({
    type: 'zerro.envelope.create',
    payload: input,
  })

  return (dispatch, getState, extra) => {
    const receipt = execute(dispatch, getState, extra) as TCreateEnvelopeReceipt
    return receipt.envelopeId
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

export function applyEnvelopeStructure(
  structure: TApplyEnvelopeStructureInput
): AppThunk {
  return executeCommand({
    type: 'zerro.envelope.structure.apply',
    payload: structure,
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

export function deleteTransactions(ids: TTransactionId[]): AppThunk {
  return executeCommand({
    type: 'zenmoney.transaction.delete',
    payload: { ids },
  })
}

export function deleteTransactionsPermanently(ids: TTransactionId[]): AppThunk {
  return executeCommand({
    type: 'zenmoney.transaction.delete.permanent',
    payload: { ids },
  })
}

export function restoreTransaction(id: TTransactionId): AppThunk {
  return executeCommand({
    type: 'zenmoney.transaction.restore',
    payload: { id },
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

function isCompiled(
  value: TNormalizedPatch | TCompiled<unknown>
): value is TCompiled<unknown> {
  return 'patch' in value && 'receipt' in value
}
