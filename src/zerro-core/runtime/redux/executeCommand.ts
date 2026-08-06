import { v1 as uuidv1 } from 'uuid'
import type { AppDispatch, AppThunk, RootState } from 'store'
import { appendClientCommand } from 'store/data'
import { selectIsHistoryPointVisible } from 'store/history'

import {
  issuePatch,
  materializeCommand,
} from '../../internal/operations/materialization'
import {
  isCompiled,
  type TCompiled,
  type TCoreContext,
  type TIntentPatch,
} from '../../types'
import { selectData } from './state'

export type TReduxCommandCompiler<TReceipt = unknown> = (
  state: RootState,
  ctx: TCoreContext
) => TIntentPatch | TCompiled<TReceipt>

export type TCommandExecution<TReceipt> = {
  applied: boolean
  receipt: TReceipt | undefined
}

// Late-bound lookups so Date.now/uuid mocks installed after module load work.
const defaultCtx = { now: () => Date.now(), uuid: () => uuidv1() }

/**
 * Cycle-safe Redux execution primitive. It intentionally imports no selectors
 * or app entity modules, so hidden-store reminder writers can join the outbox
 * without entering the adapter selector graph during module initialization.
 */
export function executeReduxCommand<TReceipt = unknown>(
  compile: TReduxCommandCompiler<TReceipt>
): AppThunk<TReceipt | undefined> {
  return (dispatch, getState, extra) => {
    return executeReduxCommandWithStatus(compile)(dispatch, getState, extra)
      .receipt
  }
}

/** Like `executeReduxCommand`, but reports whether an outbox command was added. */
export function executeReduxCommandWithStatus<TReceipt = unknown>(
  compile: TReduxCommandCompiler<TReceipt>,
  options: { allowHistory?: boolean } = {}
): AppThunk<TCommandExecution<TReceipt>> {
  return (dispatch, getState) => {
    const state = getState()
    if (selectIsHistoryPointVisible(state) && !options.allowHistory) {
      return { applied: false, receipt: undefined }
    }
    const result = compile(state, defaultCtx)
    const patch = isCompiled(result) ? result.patch : result
    const applied =
      !isEmptyPatch(patch) &&
      appendIntentPatch(dispatch, state, patch, options.allowHistory)

    return {
      applied,
      receipt: isCompiled(result) ? result.receipt : undefined,
    }
  }
}

export function executeReduxPatch(patch: TIntentPatch): AppThunk {
  return (dispatch, getState) => {
    const state = getState()
    if (!selectIsHistoryPointVisible(state))
      appendIntentPatch(dispatch, state, patch)
  }
}

function appendIntentPatch(
  dispatch: AppDispatch,
  state: RootState,
  patch: TIntentPatch,
  allowHistory = false
): boolean {
  const data = selectData(state, allowHistory ? 'live' : 'displayed')
  const command = issuePatch(data, patch, defaultCtx.now())
  const materialized = materializeCommand(data, command)
  if (isEmptyPatch(materialized)) return false

  dispatch(appendClientCommand(command))
  return true
}

function isEmptyPatch(patch: TIntentPatch): boolean {
  return Object.keys(patch).length === 0
}
