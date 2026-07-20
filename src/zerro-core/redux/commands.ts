import type { AppThunk, RootState } from 'store'
import { v1 as uuidv1 } from 'uuid'
import type { TISOMonth } from '../domain/zenmoney/primitives'
import {
  type TCompiled,
  type TCoreContext,
  type TIntentPatch,
  type TNormalizedPatch,
} from '../types'
import {
  compileBulkEditTransactions,
  compileCombineToIncome,
  compileCombineToOutcome,
  compileCreateAccount,
  compileDeleteTransactions,
  compileDeleteTransactionsPermanently,
  compileMergeTransactionsAsTransfer,
  compilePatchAccount,
  compileDeleteReminder,
  compileRestoreTransaction,
  compileSetReminder,
  type TAccountId,
  type TTagId,
  type TTransactionId,
  type TTransactionEditablePatch,
  type TTransactionRecreatePatch,
  type TReminderDraft,
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
import {
  executeReduxCommand,
  executeReduxPatch,
  type TReduxCommandCompiler,
} from './executeCommand'

export type { TBudgetUpdate } from '../domain/zerro'

function executeCommand<TReceipt = undefined>(
  compile: TReduxCommandCompiler<TReceipt>
): AppThunk<TReceipt | undefined> {
  return executeReduxCommand(compile)
}

export function setBudget(updates: TBudgetUpdate[]): AppThunk {
  return executeCommand((state, ctx) =>
    compileSetBudget(state.data.current, updates, ctx)
  )
}

export function editFxRates(month: TISOMonth, patch: TFxRates): AppThunk {
  return executeCommand((state, ctx) => {
    const current = getCommandFxRates(state)(month)
    const rates = { ...current.rates }
    Object.entries(patch).forEach(([code, rate]) => {
      if (rate > 0) rates[code] = rate
    })
    return compileSetFxRates(state.data.current, month, rates, ctx)
  })
}

export function resetFxRates(month: TISOMonth): AppThunk {
  return executeCommand(state => compileResetFxRates(state.data.current, month))
}

export function setEmojiIcons(enabled: boolean): AppThunk {
  return executeCommand((state, ctx) =>
    compilePatchUserSettings(state.data.current, { emojiIcons: enabled }, ctx)
  )
}

export function setPreferZmBudgets(enabled: boolean): AppThunk {
  return executeCommand((state, ctx) =>
    compilePatchUserSettings(
      state.data.current,
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
    compileSetGoal(state.data.current, month, id, goal, ctx)
  )
}

export function createEnvelope(
  input: TCreateEnvelopeInput
): AppThunk<TEnvelopeId> {
  const execute = executeCommand<TCreateEnvelopeReceipt>((state, ctx) => {
    const labels = getCommandEnvelopeLabels()
    return compileCreateEnvelope(
      state.data.current,
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
    compileRenameEnvelope(state.data.current, { id, name })
  )
}

export function setEnvelopeColor(
  id: TEnvelopeId,
  colorHex: string | null
): AppThunk {
  return executeCommand(state =>
    compileSetEnvelopeColor(state.data.current, { id, colorHex })
  )
}

export function setEnvelopeComment(id: TEnvelopeId, comment: string): AppThunk {
  return executeCommand((state, ctx) =>
    compileSetEnvelopeComment(state.data.current, { id, comment }, ctx)
  )
}

export function applyEnvelopeStructure(
  structure: TApplyEnvelopeStructureInput
): AppThunk {
  return executeCommand((state, ctx) => {
    const labels = getCommandEnvelopeLabels()
    return compileApplyEnvelopeStructure(
      state.data.current,
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
      state.data.current,
      getCommandDomainEnvelopes(state),
      normalizeEnvelopeSettings(state, input),
      ctx
    )
  )
}

export function deleteTransactions(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileDeleteTransactions(state.data.current, ids)
  )
}

export function deleteTransactionsPermanently(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileDeleteTransactionsPermanently(state.data.current, ids)
  )
}

export function restoreTransaction(id: TTransactionId): AppThunk {
  return executeCommand((state, ctx) =>
    compileRestoreTransaction(state.data.current, id, ctx)
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
    compilePatchAccount(state.data.current, { id, inBalance })
  )
}

export function setReminder(
  draft:
    TReminderDraft | TReminderPatch | Array<TReminderDraft | TReminderPatch>
): AppThunk<TReminderPatch[]> {
  const execute = executeCommand<TReminderPatch[]>((state, ctx) => {
    const patch = compileSetReminder(state.data.current, draft, ctx)
    return { patch, receipt: patch.reminder || [] }
  })

  return (dispatch, getState, extra) => execute(dispatch, getState, extra) || []
}

export function deleteReminder(id: TReminderId): AppThunk {
  return executeCommand(state => compileDeleteReminder(state.data.current, id))
}

export function prepareDataAccount(title: string): AppThunk<TAccountId> {
  const execute = executeCommand<TAccountId>((state, ctx) => {
    const data = state.data.current
    const existing = Object.values(data.account).find(
      account => account.title === title
    )
    if (existing) return { patch: {}, receipt: existing.id }
    const userId = getRootUserId(data)
    if (!userId) throw new Error('No root user')
    const patch = compileCreateAccount(
      data,
      { title, instrument: data.user[userId].currency },
      ctx
    )
    const accountId = patch.account?.[0]?.id
    if (!accountId) throw new Error('Data account was not created')
    return { patch, receipt: accountId }
  })

  return (dispatch, getState, extra) => {
    const accountId = execute(dispatch, getState, extra)
    if (!accountId) throw new Error('Data account was not prepared')
    return accountId
  }
}

export function applyDebugPatch(patch: TNormalizedPatch): AppThunk {
  return executeCommand(() => patch)
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
    compileBulkEditTransactions(state.data.current, ids, opts)
  )
}

export function combineTransactionsToOutcome(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileCombineToOutcome(state.data.current, ids)
  )
}

export function combineTransactionsToIncome(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileCombineToIncome(state.data.current, ids)
  )
}

export function mergeTransactionsAsTransfer(ids: TTransactionId[]): AppThunk {
  return executeCommand(state =>
    compileMergeTransactionsAsTransfer(state.data.current, ids)
  )
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
