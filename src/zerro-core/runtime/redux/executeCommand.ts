import { v1 as uuidv1 } from 'uuid'
import { t } from 'i18next'
import { toast } from '@/6-shared/ui/kit/Toast'
import type { AppDispatch, AppThunk, RootState } from '@/store'
import {
  appendClientCommand,
  canReplaceTail,
  editClientCommand,
  getReplicaWriteBlocked,
} from '@/store/data'
import { selectIsHistoryPointVisible } from '@/store/history'

import {
  prepareCommand,
  materializeCommand,
  type TCommandLabel,
} from '../../internal/operations/materialization'
import { type TCompiled, type TCoreContext } from '../../types'
import { selectData } from './state'
import { applyOutboxCommand, replayOutbox } from '../../replica'
import type { TDataStore } from '../../internal/domain/zenmoney/model/store'

export type TReduxCommandCompiler<TReceipt = unknown> = (
  state: RootState,
  ctx: TCoreContext
) => TCompiled<TReceipt>

export type TCommandExecution<TReceipt> = {
  status: 'applied' | 'noop' | 'blocked'
  receipt: TReceipt | undefined
}

// Late-bound lookups so Date.now/uuid mocks installed after module load work.
export const coreContext: TCoreContext = {
  now: () => Date.now(),
  uuid: () => uuidv1(),
}

/**
 * Cycle-safe Redux execution primitive. It intentionally imports no selectors
 * or app entity modules, so hidden-store reminder writers can join the outbox
 * without entering the adapter selector graph during module initialization.
 */
export function executeReduxCommand<TReceipt = unknown>(
  compile: TReduxCommandCompiler<TReceipt>,
  options: TExecuteOptions = {}
): AppThunk<TReceipt | undefined> {
  return (dispatch, getState, extra) => {
    return executeReduxCommandWithStatus(compile, options)(
      dispatch,
      getState,
      extra
    ).receipt
  }
}

export type TExecuteOptions = {
  allowHistory?: boolean
  /** What the user did, carried onto the command for history. */
  label?: TCommandLabel
}

/** Like `executeReduxCommand`, but reports whether an outbox command was added. */
export function executeReduxCommandWithStatus<TReceipt = unknown>(
  compile: TReduxCommandCompiler<TReceipt>,
  options: TExecuteOptions = {}
): AppThunk<TCommandExecution<TReceipt>> {
  return (dispatch, getState) => {
    const state = getState()
    if (isWriteBlocked(state, options.allowHistory)) {
      notifyWriteBlocked()
      return { status: 'blocked', receipt: undefined }
    }
    const result = compile(state, coreContext)
    const applied =
      result.operations.length > 0 &&
      appendCommand(dispatch, state, result, options)

    return {
      status: applied ? 'applied' : 'noop',
      receipt: result.receipt,
    }
  }
}

function appendCommand(
  dispatch: AppDispatch,
  state: RootState,
  compiled: TCompiled<unknown>,
  { allowHistory = false, label }: TExecuteOptions = {}
): boolean {
  const data = selectData(state, allowHistory ? 'live' : 'displayed')
  const command = prepareCommand(
    data,
    compiled.operations,
    coreContext.now(),
    label
  )
  const materialized = materializeCommand(data, command)
  if (!Object.keys(materialized).length) return false

  dispatch(appendClientCommand(command))
  return true
}

function isWriteBlocked(state: RootState, allowHistory = false): boolean {
  return (
    getReplicaWriteBlocked(state) ||
    (!allowHistory && selectIsHistoryPointVisible(state))
  )
}

function notifyWriteBlocked() {
  toast.add({
    type: 'error',
    title: t('commandWriteBlocked', { ns: 'common' }),
  })
}

// One toast per group, not one per drag frame.
let blockedGroup: string | null = null

// Live snapshot -> the state before the group's first edit. A pull replaces
// the snapshot, so a miss replays the outbox prefix from base once.
const beforeGroupedEdit = new WeakMap<TDataStore, TDataStore>()

/** Replace the group's tail command with one compiled against the state
 * before the group's first edit. Once the tail is sealed (any other outbox
 * change, sync or undo), the next edit starts a new command. */
export function editGroupedCommand(
  group: string,
  label: TCommandLabel,
  compile: (before: TDataStore, live: TDataStore) => TCompiled
): AppThunk {
  return (dispatch, getState) => {
    const state = getState()
    if (isWriteBlocked(state)) {
      if (blockedGroup !== group) notifyWriteBlocked()
      blockedGroup = group
      return
    }
    const { base, current, outbox } = state.data
    const replacing = canReplaceTail(state.data, group)
    const before = replacing
      ? (beforeGroupedEdit.get(current) ??
        replayOutbox(base, outbox.slice(0, -1)))
      : current
    const { operations } = compile(before, current)
    if (!operations.length && !replacing) return
    const command = operations.length
      ? prepareCommand(before, operations, coreContext.now(), label)
      : null
    const next = command ? applyOutboxCommand(before, command) : before
    if (command) beforeGroupedEdit.set(next, before)
    dispatch(editClientCommand({ group, command, current: next }))
  }
}
