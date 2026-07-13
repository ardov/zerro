import type { AppThunk, RootState } from 'store'
import type { TISOMonth } from '../domain/zenmoney/primitives'
import type { TCompiled, TCoreContext, TNormalizedPatch } from '../types'
import {
  compileApplyChangesToTransaction,
  compileBulkEditTransactions,
  compileCombineToIncome,
  compileCombineToOutcome,
  compileCreateAccount,
  compileDeleteTransactions,
  compileDeleteTransactionsPermanently,
  compileMarkTransactionsViewed,
  compileMergeAccounts,
  compileMergeTransactionsAsTransfer,
  compilePatchAccount,
  compileDeleteReminder,
  compileRecreateTransaction,
  compileRestoreTransaction,
  compileSetReminder,
  type TAccountId,
  type TTagId,
  type TTransactionId,
  type TTransactionPatch,
  type TReminderDraft,
  type TReminder,
  type TReminderId,
  type TReminderPatch,
} from '../domain/zenmoney'
import { getRootUserId } from '../domain/zenmoney/users'
import {
  compileApplyEnvelopeStructure,
  compileCreateEnvelope,
  compileRenameEnvelope,
  compileSetEnvelopeColor,
  compileSetEnvelopeComment,
  compileUpdateEnvelopeSettings,
  compileSetBudget,
  compileSetGoal,
  compileSetFxRates,
  compileResetFxRates,
  compilePatchUserSettings,
  type TApplyEnvelopeStructureInput,
  type TBudgetUpdate,
  type TCreateEnvelopeInput,
  type TCreateEnvelopeReceipt,
  type TEnvelopeId,
  type TGoal,
  type TFxRates,
  type TRenameEnvelopeInput,
  type TSetEnvelopeColorInput,
  type TSetEnvelopeCommentInput,
  type TUpdateEnvelopeSettingsInput,
} from '../domain/zerro'
import { getDomainEnvelopeGroup } from './envelopePresentation'
import {
  getCommandDomainEnvelopes,
  getCommandEnvelopeLabels,
  getCommandFxRates,
  getCommandPresentedEnvelopes,
} from './commandRead'
import { executeReduxCommand } from './executeCommand'

export type { TBudgetUpdate } from '../domain/zerro'

/**
 * Serializable app commands. Once the outbox is persisted, a stored payload
 * shape becomes a contract: breaking changes mint a new type (for example
 * `zerro.budget.set@2`) or migrate eagerly at the storage boundary — the
 * persisted outbox gets its own schema version there.
 *
 */
export type TAppCommand =
  | { type: 'zerro.budget.set'; payload: TBudgetUpdate[] }
  | {
      type: 'zerro.fxRates.edit'
      payload: { month: TISOMonth; patch: TFxRates }
    }
  | { type: 'zerro.fxRates.reset'; payload: { month: TISOMonth } }
  | { type: 'zerro.userSettings.emojiIcons.set'; payload: { enabled: boolean } }
  | {
      type: 'zerro.userSettings.preferZmBudgets.set'
      payload: { enabled: boolean }
    }
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
  | {
      type: 'zenmoney.transaction.viewed.set'
      payload: { ids: TTransactionId[]; viewed: boolean }
    }
  | { type: 'zenmoney.transaction.update'; payload: TTransactionPatch }
  | { type: 'zenmoney.transaction.recreate'; payload: TTransactionPatch }
  | {
      type: 'zenmoney.transaction.bulk.edit'
      payload: { ids: TTransactionId[]; tags?: TTagId[]; comment?: string }
    }
  | {
      type: 'zenmoney.account.inBalance.set'
      payload: { id: TAccountId; inBalance: boolean }
    }
  | {
      type: 'zenmoney.account.merge'
      payload: { source: TAccountId; target: TAccountId }
    }
  | {
      type: 'zenmoney.reminder.set'
      payload:
        | TReminderDraft
        | TReminderPatch
        | Array<TReminderDraft | TReminderPatch>
    }
  | { type: 'zenmoney.reminder.delete'; payload: { id: TReminderId } }
  | {
      type: 'infrastructure.dataAccount.prepare@2'
      payload: { title: string }
    }
  | { type: 'infrastructure.debug.patch'; payload: TNormalizedPatch }
  | {
      type: 'zenmoney.transaction.combineToOutcome'
      payload: { ids: TTransactionId[] }
    }
  | {
      type: 'zenmoney.transaction.combineToIncome'
      payload: { ids: TTransactionId[] }
    }
  | {
      type: 'zenmoney.transaction.mergeAsTransfer'
      payload: { ids: TTransactionId[] }
    }

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
    case 'zerro.fxRates.edit': {
      const current = getCommandFxRates(state)(command.payload.month)
      const rates = { ...current.rates }
      Object.entries(command.payload.patch).forEach(([code, rate]) => {
        if (rate > 0) rates[code] = rate
      })
      return compileSetFxRates(data, command.payload.month, rates, ctx)
    }
    case 'zerro.fxRates.reset':
      return compileResetFxRates(data, command.payload.month, ctx)
    case 'zerro.userSettings.emojiIcons.set':
      return compilePatchUserSettings(
        data,
        { emojiIcons: command.payload.enabled },
        ctx
      )
    case 'zerro.userSettings.preferZmBudgets.set':
      return compilePatchUserSettings(
        data,
        { preferZmBudgets: command.payload.enabled },
        ctx
      )
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
        getCommandDomainEnvelopes(state),
        normalizeEnvelopeSettings(state, command.payload),
        ctx
      )
    case 'zerro.envelope.create': {
      const labels = getCommandEnvelopeLabels()
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
      const labels = getCommandEnvelopeLabels()
      const structure = command.payload.map(group => ({
        ...group,
        group: getDomainEnvelopeGroup(group.group, labels),
      }))
      return compileApplyEnvelopeStructure(
        data,
        getCommandDomainEnvelopes(state),
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
    case 'zenmoney.transaction.viewed.set':
      return compileMarkTransactionsViewed(
        data,
        command.payload.ids,
        command.payload.viewed,
        ctx
      )
    case 'zenmoney.transaction.update':
      return compileApplyChangesToTransaction(data, command.payload, ctx)
    case 'zenmoney.transaction.recreate':
      return compileRecreateTransaction(data, command.payload, ctx)
    case 'zenmoney.transaction.bulk.edit': {
      const { ids, tags, comment } = command.payload
      return compileBulkEditTransactions(data, ids, { tags, comment }, ctx)
    }
    case 'zenmoney.account.inBalance.set': {
      const { id, inBalance } = command.payload
      return compilePatchAccount(data, { id, inBalance }, ctx)
    }
    case 'zenmoney.account.merge': {
      const { source, target } = command.payload
      return compileMergeAccounts(data, source, target, ctx)
    }
    case 'zenmoney.reminder.set': {
      const patch = compileSetReminder(data, command.payload, ctx)
      return { patch, receipt: patch.reminder || [] }
    }
    case 'zenmoney.reminder.delete':
      return compileDeleteReminder(data, command.payload.id, ctx)
    case 'infrastructure.dataAccount.prepare@2': {
      const existing = Object.values(data.account).find(
        account => account.title === command.payload.title
      )
      if (existing) return { patch: {}, receipt: existing.id }

      const userId = getRootUserId(data)
      if (!userId) throw new Error('No root user')
      const patch = compileCreateAccount(
        data,
        {
          title: command.payload.title,
          instrument: data.user[userId].currency,
        },
        ctx
      )
      const accountId = patch.account?.[0]?.id
      if (!accountId) throw new Error('Data account was not created')
      return { patch, receipt: accountId }
    }
    case 'infrastructure.debug.patch':
      return command.payload
    case 'zenmoney.transaction.combineToOutcome':
      return compileCombineToOutcome(data, command.payload.ids, ctx)
    case 'zenmoney.transaction.combineToIncome':
      return compileCombineToIncome(data, command.payload.ids, ctx)
    case 'zenmoney.transaction.mergeAsTransfer':
      return compileMergeTransactionsAsTransfer(data, command.payload.ids, ctx)
  }
}

/**
 * The internal write funnel compiles a command against current state and
 * appends its materialized result to the Redux-owned outbox. Only narrow
 * semantic commands are exported from this adapter.
 */
function executeCommand<TReceipt = undefined>(
  command: TAppCommand
): AppThunk<TReceipt | undefined> {
  return executeReduxCommand<TReceipt>(
    command,
    (state, ctx) =>
      // Receipt types are documented by the four public wrappers that request
      // one; the command compiler stays a simple runtime switch.
      compileAppCommandResult(state, command, ctx) as
        | TNormalizedPatch
        | TCompiled<TReceipt>
  )
}

export function setBudget(updates: TBudgetUpdate[]): AppThunk {
  return executeCommand({ type: 'zerro.budget.set', payload: updates })
}

export function editFxRates(month: TISOMonth, patch: TFxRates): AppThunk {
  return executeCommand({
    type: 'zerro.fxRates.edit',
    payload: { month, patch },
  })
}

export function resetFxRates(month: TISOMonth): AppThunk {
  return executeCommand({
    type: 'zerro.fxRates.reset',
    payload: { month },
  })
}

export function setEmojiIcons(enabled: boolean): AppThunk {
  return executeCommand({
    type: 'zerro.userSettings.emojiIcons.set',
    payload: { enabled },
  })
}

export function setPreferZmBudgets(enabled: boolean): AppThunk {
  return executeCommand({
    type: 'zerro.userSettings.preferZmBudgets.set',
    payload: { enabled },
  })
}

export function setGoal(
  month: TISOMonth,
  id: TEnvelopeId,
  goal: TGoal | null
): AppThunk {
  return executeCommand({
    type: 'zerro.goal.set',
    payload: { month, id, goal },
  })
}

export function createEnvelope(
  input: TCreateEnvelopeInput
): AppThunk<TEnvelopeId> {
  const execute = executeCommand<TCreateEnvelopeReceipt>({
    type: 'zerro.envelope.create',
    payload: input,
  })

  return (dispatch, getState, extra) => {
    const receipt = execute(dispatch, getState, extra)
    if (!receipt) throw new Error('Envelope was not created')
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

export function setTransactionsViewed(
  ids: TTransactionId[],
  viewed: boolean
): AppThunk {
  return executeCommand({
    type: 'zenmoney.transaction.viewed.set',
    payload: { ids, viewed },
  })
}

export function applyChangesToTransaction(patch: TTransactionPatch): AppThunk {
  return executeCommand({
    type: 'zenmoney.transaction.update',
    payload: patch,
  })
}

export function recreateTransaction(
  patch: TTransactionPatch
): AppThunk<TTransactionId> {
  const execute = executeCommand<{ transactionId: TTransactionId }>({
    type: 'zenmoney.transaction.recreate',
    payload: patch,
  })

  return (dispatch, getState, extra) => {
    const receipt = execute(dispatch, getState, extra)
    if (!receipt) throw new Error('Transaction was not recreated')
    return receipt.transactionId
  }
}

export function setAccountInBalance(
  id: TAccountId,
  inBalance: boolean
): AppThunk {
  return executeCommand({
    type: 'zenmoney.account.inBalance.set',
    payload: { id, inBalance },
  })
}

export function mergeAccounts(
  source: TAccountId,
  target: TAccountId
): AppThunk {
  return executeCommand({
    type: 'zenmoney.account.merge',
    payload: { source, target },
  })
}

export function setReminder(
  draft:
    | TReminderDraft
    | TReminderPatch
    | Array<TReminderDraft | TReminderPatch>
): AppThunk<TReminder[]> {
  const execute = executeCommand<TReminder[]>({
    type: 'zenmoney.reminder.set',
    payload: draft,
  })

  return (dispatch, getState, extra) => execute(dispatch, getState, extra) || []
}

export function deleteReminder(id: TReminderId): AppThunk {
  return executeCommand({
    type: 'zenmoney.reminder.delete',
    payload: { id },
  })
}

export function prepareDataAccount(title: string): AppThunk<TAccountId> {
  const execute = executeCommand<TAccountId>({
    type: 'infrastructure.dataAccount.prepare@2',
    payload: { title },
  })

  return (dispatch, getState, extra) => {
    const accountId = execute(dispatch, getState, extra)
    if (!accountId) throw new Error('Data account was not prepared')
    return accountId
  }
}

export function applyDebugPatch(patch: TNormalizedPatch): AppThunk {
  return executeCommand({
    type: 'infrastructure.debug.patch',
    payload: patch,
  })
}

export function bulkEditTransactions(
  ids: TTransactionId[],
  opts: { tags?: TTagId[]; comment?: string }
): AppThunk {
  return executeCommand({
    type: 'zenmoney.transaction.bulk.edit',
    payload: { ids, ...opts },
  })
}

export function combineTransactionsToOutcome(ids: TTransactionId[]): AppThunk {
  return executeCommand({
    type: 'zenmoney.transaction.combineToOutcome',
    payload: { ids },
  })
}

export function combineTransactionsToIncome(ids: TTransactionId[]): AppThunk {
  return executeCommand({
    type: 'zenmoney.transaction.combineToIncome',
    payload: { ids },
  })
}

export function mergeTransactionsAsTransfer(ids: TTransactionId[]): AppThunk {
  return executeCommand({
    type: 'zenmoney.transaction.mergeAsTransfer',
    payload: { ids },
  })
}

function normalizeEnvelopeSettings(
  state: RootState,
  input: TUpdateEnvelopeSettingsInput
): TUpdateEnvelopeSettingsInput {
  const domain = getCommandDomainEnvelopes(state)[input.id]
  const presented = getCommandPresentedEnvelopes(state)[input.id]
  if (!domain || !presented) return input

  return {
    ...input,
    name:
      input.name === presented.originalName ? domain.originalName : input.name,
    colorHex:
      input.colorHex === presented.colorHex ? domain.colorHex : input.colorHex,
  }
}

function isCompiled(
  value: TNormalizedPatch | TCompiled<unknown>
): value is TCompiled<unknown> {
  return 'patch' in value && 'receipt' in value
}
