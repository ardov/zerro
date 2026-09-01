import type { AppThunk, RootState } from '@/store'
import { v1 as uuidv1 } from 'uuid'
import {
  compileBulkEditTransactions,
  compileCombineToIncome,
  compileCombineToOutcome,
  compileCreateTransaction,
  compileDeleteTransactions,
  compileDeleteTransactionsPermanently,
  compileMergeTransactionsAsTransfer,
  compileRestoreTransaction,
  type TCreateTransactionInput,
  type TCreateTransactionReceipt,
  type TTransactionId,
  type TTransactionEditablePatch,
  type TTransactionRecreatePatch,
} from '../../internal/domain/zenmoney/entities/transactions'
import {
  compilePatchAccount,
  type TAccountId,
} from '../../internal/domain/zenmoney/entities/accounts'
import {
  compileDeleteReminder,
  compileSetReminder,
  type TReminderDraft,
  type TReminderId,
  type TReminderPatch,
} from '../../internal/domain/zenmoney/entities/reminders'
import type { TISOMonth } from '../../internal/domain/foundation/primitives'
import type { TDataStore } from '../../internal/domain/zenmoney/model/store'
import { buildRestorePlan } from '../../internal/operations/restore/diffStores'
import { checkBackupCompatibility } from '../../internal/operations/restore/backupCompatibility'
import type { TTagId } from '../../internal/domain/zenmoney/entities/tags'
import { selectData } from './state'
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
  type TUpdateEnvelopeSettingsInput,
} from '../../internal/domain/zerro'
import { getDomainEnvelopeGroup } from './envelopePresentation'
import {
  getCommandDomainEnvelopes,
  getCommandEnvelopeLabels,
  getCommandFxRates,
  getCommandPresentedEnvelopes,
} from './commandRead'
import {
  executeReduxCommand,
  executeReduxPatch,
  executeReduxCommandWithStatus,
  type TReduxCommandCompiler,
} from './executeCommand'
import type { TCommandLabel } from '../../internal/operations/materialization'

export type { TBudgetUpdate } from '../../internal/domain/zerro'

/**
 * Every command names its own verb. It is the only place that can: by the time
 * a patch exists, the intent has been compiled into rows that no longer say
 * whether an envelope was renamed or repainted.
 */
function executeCommand<TReceipt = undefined>(
  compile: TReduxCommandCompiler<TReceipt>,
  label: TCommandLabel
): AppThunk<TReceipt | undefined> {
  return executeReduxCommand(compile, { label })
}

export function setBudget(updates: TBudgetUpdate[]): AppThunk {
  return executeCommand(
    (state, ctx) => compileSetBudget(selectData(state), updates, ctx),
    { verb: 'budget-set' }
  )
}

export function editFxRates(month: TISOMonth, patch: TFxRates): AppThunk {
  return executeCommand(
    (state, ctx) => {
      const current = getCommandFxRates(state)(month)
      const rates = { ...current.rates }
      Object.entries(patch).forEach(([code, rate]) => {
        if (rate > 0) rates[code] = rate
      })
      return compileSetFxRates(selectData(state), month, rates, ctx)
    },
    { verb: 'fx-rates-set' }
  )
}

export function resetFxRates(month: TISOMonth): AppThunk {
  return executeCommand(
    state => compileResetFxRates(selectData(state), month),
    { verb: 'fx-rates-reset' }
  )
}

export function setEmojiIcons(enabled: boolean): AppThunk {
  return executeCommand(
    (state, ctx) =>
      compilePatchUserSettings(selectData(state), { emojiIcons: enabled }, ctx),
    { verb: 'settings-changed' }
  )
}

export function setPreferZmBudgets(enabled: boolean): AppThunk {
  return executeCommand(
    (state, ctx) =>
      compilePatchUserSettings(
        selectData(state),
        { preferZmBudgets: enabled },
        ctx
      ),
    { verb: 'settings-changed' }
  )
}

export function setGoal(
  month: TISOMonth,
  id: TEnvelopeId,
  goal: TGoal | null
): AppThunk {
  return executeCommand(
    (state, ctx) => compileSetGoal(selectData(state), month, id, goal, ctx),
    { verb: 'goal-set', args: { id } }
  )
}

export function createEnvelope(
  input: TCreateEnvelopeInput
): AppThunk<TEnvelopeId> {
  const execute = executeCommand<TCreateEnvelopeReceipt>(
    (state, ctx) => {
      const labels = getCommandEnvelopeLabels()
      return compileCreateEnvelope(
        selectData(state),
        {
          ...input,
          group: input.group
            ? getDomainEnvelopeGroup(input.group, labels)
            : undefined,
        },
        ctx
      )
    },
    { verb: 'envelope-created', args: { name: input.name } }
  )

  return (dispatch, getState, extra) => {
    const receipt = execute(dispatch, getState, extra)
    if (!receipt) throw new Error('Envelope was not created')
    return receipt.envelopeId
  }
}

export function renameEnvelope(id: TEnvelopeId, name: string): AppThunk {
  return executeCommand(
    state => compileRenameEnvelope(selectData(state), { id, name }),
    { verb: 'envelope-renamed', args: { id, name } }
  )
}

export function setEnvelopeColor(
  id: TEnvelopeId,
  colorHex: string | null
): AppThunk {
  return executeCommand(
    state => compileSetEnvelopeColor(selectData(state), { id, colorHex }),
    { verb: 'envelope-color-set', args: { id } }
  )
}

export function setEnvelopeComment(id: TEnvelopeId, comment: string): AppThunk {
  return executeCommand(
    (state, ctx) =>
      compileSetEnvelopeComment(selectData(state), { id, comment }, ctx),
    { verb: 'envelope-comment-set', args: { id } }
  )
}

export function applyEnvelopeStructure(
  structure: TApplyEnvelopeStructureInput
): AppThunk {
  return executeCommand(
    (state, ctx) => {
      const labels = getCommandEnvelopeLabels()
      return compileApplyEnvelopeStructure(
        selectData(state),
        getCommandDomainEnvelopes(state),
        structure.map(group => ({
          ...group,
          group: getDomainEnvelopeGroup(group.group, labels),
        })),
        ctx
      )
    },
    { verb: 'envelope-structure-changed' }
  )
}

export function updateEnvelopeSettings(
  input: TUpdateEnvelopeSettingsInput
): AppThunk {
  return executeCommand(
    (state, ctx) =>
      compileUpdateEnvelopeSettings(
        selectData(state),
        getCommandDomainEnvelopes(state),
        normalizeEnvelopeSettings(state, input),
        ctx
      ),
    { verb: 'envelope-settings-changed', args: { id: input.id } }
  )
}

export function deleteTransactions(ids: TTransactionId[]): AppThunk {
  return executeCommand(
    state => compileDeleteTransactions(selectData(state).transaction, ids),
    { verb: 'transactions-deleted' }
  )
}

export function createTransaction(
  input: TCreateTransactionInput
): AppThunk<TTransactionId> {
  const execute = executeCommand<TCreateTransactionReceipt>(
    (state, ctx) => compileCreateTransaction(selectData(state), input, ctx),
    { verb: 'transaction-created' }
  )

  return (dispatch, getState, extra) => {
    const receipt = execute(dispatch, getState, extra)
    if (!receipt) throw new Error('Transaction was not created')
    return receipt.transactionId
  }
}

export function deleteTransactionsPermanently(ids: TTransactionId[]): AppThunk {
  return executeCommand(
    state =>
      compileDeleteTransactionsPermanently(selectData(state).transaction, ids),
    { verb: 'transactions-purged' }
  )
}

export function restoreTransaction(id: TTransactionId): AppThunk {
  return executeCommand(
    (state, ctx) =>
      compileRestoreTransaction(selectData(state).transaction, id, ctx),
    { verb: 'transaction-restored', args: { id } }
  )
}

export function setTransactionsViewed(
  ids: TTransactionId[],
  viewed: boolean
): AppThunk {
  return patchTransactions(ids, { viewed }, { verb: 'transactions-viewed' })
}

function patchTransactions(
  ids: TTransactionId[],
  set: TTransactionEditablePatch,
  label: TCommandLabel
): AppThunk {
  return executeReduxPatch(
    { transaction: [...new Set(ids)].map(id => ({ id, ...set })) },
    { label }
  )
}

export function applyChangesToTransaction(
  patch: TTransactionEditablePatch & { id: TTransactionId }
): AppThunk {
  const { id, ...set } = patch
  return patchTransactions([id], set, {
    verb: 'transaction-edited',
    args: { id },
  })
}

export function recreateTransaction(
  patch: TTransactionRecreatePatch & { id: TTransactionId }
): AppThunk<TTransactionId> {
  return (dispatch, getState, extra) => {
    const source = getState().data.current.transaction[patch.id]
    if (!source) {
      throw new Error(`Transaction ${patch.id} does not exist`)
    }

    const { id: sourceId, ...set } = patch
    const replacementId = uuidv1()
    const replacement = {
      ...source,
      ...set,
      id: replacementId,
      deleted: false,
    }
    const execute = executeReduxPatch(
      {
        transaction: [
          { id: sourceId, income: 0.00001, outcome: 0.00001 },
          replacement,
        ],
      },
      { label: { verb: 'transaction-recreated', args: { id: sourceId } } }
    )
    execute(dispatch, getState, extra)
    return replacementId
  }
}

export function setAccountInBalance(
  id: TAccountId,
  inBalance: boolean
): AppThunk {
  return executeCommand(
    state => compilePatchAccount(selectData(state).account, { id, inBalance }),
    { verb: 'account-in-balance-set', args: { id } }
  )
}

export function setReminder(
  draft:
    TReminderDraft | TReminderPatch | Array<TReminderDraft | TReminderPatch>
): AppThunk<TReminderPatch[]> {
  const execute = executeCommand<TReminderPatch[]>(
    (state, ctx) => {
      const data = selectData(state)
      const patch = compileSetReminder(
        { reminders: data.reminder, users: data.user },
        draft,
        ctx
      )
      return { patch, receipt: patch.reminder || [] }
    },
    { verb: 'reminder-set' }
  )

  return (dispatch, getState, extra) => execute(dispatch, getState, extra) || []
}

export function deleteReminder(id: TReminderId): AppThunk {
  return executeCommand(
    state => compileDeleteReminder(selectData(state).reminder, id),
    { verb: 'reminder-deleted', args: { id } }
  )
}

export function bulkEditTransactions(
  ids: TTransactionId[],
  opts: { tags?: TTagId[]; comment?: string }
): AppThunk {
  const label: TCommandLabel = { verb: 'transactions-bulk-edited' }
  if (!opts.tags?.includes('mixed') && !opts.comment?.includes('$&')) {
    const set: TTransactionEditablePatch = {}
    if (opts.tags) set.tag = opts.tags.filter(tag => tag !== 'null')
    if (opts.comment) set.comment = opts.comment
    return patchTransactions(ids, set, label)
  }

  return executeCommand(
    state =>
      compileBulkEditTransactions(selectData(state).transaction, ids, opts),
    label
  )
}

export function combineTransactionsToOutcome(ids: TTransactionId[]): AppThunk {
  return executeCommand(
    state => compileCombineToOutcome(selectData(state).transaction, ids),
    { verb: 'transactions-combined-outcome' }
  )
}

export function combineTransactionsToIncome(ids: TTransactionId[]): AppThunk {
  return executeCommand(
    state => compileCombineToIncome(selectData(state).transaction, ids),
    { verb: 'transactions-combined-income' }
  )
}

export function mergeTransactionsAsTransfer(ids: TTransactionId[]): AppThunk {
  return executeCommand(
    state =>
      compileMergeTransactionsAsTransfer(selectData(state).transaction, ids),
    { verb: 'transactions-merged-transfer' }
  )
}

/**
 * Writes whatever moves the full current store toward `desired`.
 *
 * The diff is recomputed at dispatch time rather than taken from the caller's
 * preview: a background pull may have landed since, and the restore is defined
 * against the store it is applied to.
 */
export function restoreDataStore(desired: TDataStore): AppThunk<boolean> {
  return (dispatch, getState, extra) =>
    (() => {
      const compatibility = checkBackupCompatibility(
        selectData(getState(), 'live'),
        desired
      )
      if (!compatibility.ok) return false

      return executeReduxCommandWithStatus(
        (state, ctx) =>
          buildRestorePlan(selectData(state, 'live'), desired, {
            allocateId: (_key, _desiredId) => ctx.uuid(),
          }).patch,
        { allowHistory: true, label: { verb: 'data-restored' } }
      )(dispatch, getState, extra).applied
    })()
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
