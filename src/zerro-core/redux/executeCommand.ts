import { v1 as uuidv1 } from 'uuid'
import type { AppDispatch, AppThunk, RootState } from 'store'
import { appendClientCommand } from 'store/data'

import { issuePatch, materializeCommand } from '../application/materializer'
import {
  isCompiled,
  type TCompiled,
  type TCoreContext,
  type TIntentPatch,
} from '../types'

export type TReduxCommandCompiler<TReceipt = unknown> = (
  state: RootState,
  ctx: TCoreContext
) => TIntentPatch | TCompiled<TReceipt>

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
  return (dispatch, getState) => {
    const state = getState()
    const result = compile(state, defaultCtx)
    const patch = isCompiled(result) ? result.patch : result

    if (!isEmptyPatch(patch)) {
      appendIntentPatch(dispatch, state, patch)
    }

    return isCompiled(result) ? result.receipt : undefined
  }
}

export function executeReduxPatch(patch: TIntentPatch): AppThunk {
  return (dispatch, getState) => {
    appendIntentPatch(dispatch, getState(), patch)
  }
}

function appendIntentPatch(
  dispatch: AppDispatch,
  state: RootState,
  patch: TIntentPatch
): void {
  const command = issuePatch(state.data.current, patch, defaultCtx.now())
  const materialized = materializeCommand(state.data.current, command)
  if (isEmptyPatch(materialized)) return

  dispatch(appendClientCommand(command))
}

function isEmptyPatch(patch: TIntentPatch): boolean {
  return Object.keys(patch).length === 0
}
