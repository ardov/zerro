import type { AppThunk, RootState } from 'store'
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
import {
  diffStores,
  type TStoreDiffScope,
} from '../../internal/operations/restore/diffStores'
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
  type TReduxCommandCompiler,
} from './executeCommand'

export type { TBudgetUpdate } from '../../internal/domain/zerro'

function executeCommand<TReceipt = undefined>(
  compile: TReduxCommandCompiler<TReceipt>
): AppThunk<TReceipt | undefined> {
  return executeReduxCommand(compile)
}

export function setBudget(updates: TBudgetUpdate[]): AppThunk {
  return executeCommand((state, ctx) =>
    compileSetBudget(selectData(state), updates, ctx)
  )
}

export function editFxRates(month: TISOMonth, patch: TFxRates): AppThunk {
  return executeCommand((state, ctx) => {
    const current = getCommandFxRates(state)(month)
    const rates = { ...current.rates }
    Object.entries(patch).forEach(([code, rate]) => {
      if (rate > 0) rates[code] = rate
    })
    return compileSetFxRates(selectData(state), month, rates, ctx)
  })
}

export function resetFxRates(month: TISOMonth): AppThunk {
  return executeCommand(state => compileResetFxRates(selectData(state), month))
}

export function setEmojiIcons(enabled: boolean): AppThunk {
  return executeCommand((state, ctx) =>
    compilePatchUserSettings(selectData(state), { emojiIcons: enabled }, ctx)
  )
}

export function setPreferZmBudgets(enabled: boolean): AppThunk {
  return executeCommand((state, ctx) =>
    compilePatchUserSettings(
      selectData(state),
      { preferZmBudgets: enabled },
      ctx
    )
  )
}

export function setGoal(
  month: TISOMonth,
  id: TEnvelopeId,
  goal: TGoal | null
): AppThunk {
  return executeCommand((state, ctx) =>
    compileSetGoal(selectData(state), month, id, goal, ctx)
  )
}

export function createEnvelope(
  input: TCreateEnvelopeInput
): AppThunk<TEnvelopeId> {
  const execute = executeCommand<TCreateEnvelopeReceipt>((state, ctx) => {
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
  })

  return (dispatch, getState, extra) => {
    const receipt = execute(dispatch, getState, extra)
    if (!receipt) throw new Error('Envelope was not created')
    return receipt.envelopeId
  }
}

export function renameEnvelope(id: TEnvelopeId, name: string): AppThunk {
  return executeCommand(state =>
    compileRenameEnvelope(selectData(state), { id, name })
  )
}

export function setEnvelopeColor(
  id: TEnvelopeId,
  colorHex: string | null
): AppThunk {
  return executeCommand(state =>
    compileSetEnvelopeColor(selectData(state), { id, colorHex })
  )
}

export function setEnvelopeComment(id: TEnvelopeId, comment: string): AppThunk {
  return executeCommand((state, ctx) =>
    compileSetEnvelopeComment(selectData(state), { id, comment }, ctx)
  )
}

export function applyEnvelopeStructure(
  structure: TApplyEnvelopeStructureInput
): AppThunk {
  return executeCommand((state, ctx) => {
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
  })
}

export function updateEnvelopeSettings(
  input: TUpdateEnvelopeSettingsInput
): AppThunk {
  return executeCommand((state, ctx) =>
    compileUpdateEnvelopeSettings(
      selectData(state),
      getCommandDomainEnvelopes(state),
      normalizeEnvelopeSettings(state, input),
      ctx
    )
  )
}

export function deleteTransactions(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileDeleteTransactions(selectData(state).transaction, ids)
  )
}

export function createTransaction(
  input: TCreateTransactionInput
): AppThunk<TTransactionId> {
  const execute = executeCommand<TCreateTransactionReceipt>((state, ctx) =>
    compileCreateTransaction(selectData(state), input, ctx)
  )

  return (dispatch, getState, extra) => {
    const receipt = execute(dispatch, getState, extra)
    if (!receipt) throw new Error('Transaction was not created')
    return receipt.transactionId
  }
}

export function deleteTransactionsPermanently(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileDeleteTransactionsPermanently(selectData(state).transaction, ids)
  )
}

export function restoreTransaction(id: TTransactionId): AppThunk {
  return executeCommand((state, ctx) =>
    compileRestoreTransaction(selectData(state).transaction, id, ctx)
  )
}

export function setTransactionsViewed(
  ids: TTransactionId[],
  viewed: boolean
): AppThunk {
  return patchTransactions(ids, { viewed })
}

function patchTransactions(
  ids: TTransactionId[],
  set: TTransactionEditablePatch
): AppThunk {
  return executeReduxPatch({
    transaction: [...new Set(ids)].map(id => ({ id, ...set })),
  })
}

export function applyChangesToTransaction(
  patch: TTransactionEditablePatch & { id: TTransactionId }
): AppThunk {
  const { id, ...set } = patch
  return patchTransactions([id], set)
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
    const execute = executeReduxPatch({
      transaction: [
        { id: sourceId, income: 0.00001, outcome: 0.00001 },
        replacement,
      ],
    })
    execute(dispatch, getState, extra)
    return replacementId
  }
}

export function setAccountInBalance(
  id: TAccountId,
  inBalance: boolean
): AppThunk {
  return executeCommand(state =>
    compilePatchAccount(selectData(state).account, { id, inBalance })
  )
}

export function setReminder(
  draft:
    TReminderDraft | TReminderPatch | Array<TReminderDraft | TReminderPatch>
): AppThunk<TReminderPatch[]> {
  const execute = executeCommand<TReminderPatch[]>((state, ctx) => {
    const data = selectData(state)
    const patch = compileSetReminder(
      { reminders: data.reminder, users: data.user },
      draft,
      ctx
    )
    return { patch, receipt: patch.reminder || [] }
  })

  return (dispatch, getState, extra) => execute(dispatch, getState, extra) || []
}

export function deleteReminder(id: TReminderId): AppThunk {
  return executeCommand(state =>
    compileDeleteReminder(selectData(state).reminder, id)
  )
}

export function bulkEditTransactions(
  ids: TTransactionId[],
  opts: { tags?: TTagId[]; comment?: string }
): AppThunk {
  if (!opts.tags?.includes('mixed') && !opts.comment?.includes('$&')) {
    const set: TTransactionEditablePatch = {}
    if (opts.tags) set.tag = opts.tags.filter(tag => tag !== 'null')
    if (opts.comment) set.comment = opts.comment
    return patchTransactions(ids, set)
  }

  return executeCommand(state =>
    compileBulkEditTransactions(selectData(state).transaction, ids, opts)
  )
}

export function combineTransactionsToOutcome(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileCombineToOutcome(selectData(state).transaction, ids)
  )
}

export function combineTransactionsToIncome(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileCombineToIncome(selectData(state).transaction, ids)
  )
}

export function mergeTransactionsAsTransfer(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileMergeTransactionsAsTransfer(selectData(state).transaction, ids)
  )
}

/**
 * Writes whatever moves the store toward `desired` inside `scope`.
 *
 * The diff is recomputed at dispatch time rather than taken from the caller's
 * preview: a background pull may have landed since, and the restore is defined
 * against the store it is applied to.
 */
export function restoreDataStore(
  desired: TDataStore,
  scope?: TStoreDiffScope
): AppThunk {
  return executeCommand(state => diffStores(selectData(state), desired, scope))
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
