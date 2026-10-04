import { v1 as uuidv1 } from 'uuid'
import type { AppDispatch, AppThunk, RootState } from '@/store'
import { appendClientCommand, getReplicaWriteBlocked } from '@/store/data'
import { selectIsHistoryPointVisible } from '@/store/history'

import {
  prepareCommand,
  materializeCommand,
  type TCommandLabel,
} from '../../internal/operations/materialization'
import { type TCompiled, type TCoreContext } from '../../types'
import { selectData } from './state'

export type TReduxCommandCompiler<TReceipt = unknown> = (
  state: RootState,
  ctx: TCoreContext
) => TCompiled<TReceipt>

export type TCommandExecution<TReceipt> = {
  applied: boolean
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
    if (
      getReplicaWriteBlocked(state) ||
      (selectIsHistoryPointVisible(state) && !options.allowHistory)
    ) {
      return { applied: false, receipt: undefined }
    }
    const result = compile(state, coreContext)
    const applied =
      result.operations.length > 0 &&
      appendCommand(dispatch, state, result, options)

    return {
      applied,
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
