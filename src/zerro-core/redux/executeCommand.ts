import { v1 as uuidv1 } from 'uuid'
import type { AppDispatch, AppThunk, RootState } from 'store'
import { appendClientOutboxEntry } from 'store/data'

import type { TOutboxEntry } from '../infrastructure/replica/outbox'
import {
  makeResolvedPatchCommand,
  materializeCommand,
  type TDurableCommand,
} from '../application/materializer'
import type { TCompiled, TCoreContext, TNormalizedPatch } from '../types'

export type TReduxCommandCompiler<TReceipt = unknown> = (
  state: RootState,
  ctx: TCoreContext
) => TNormalizedPatch | TCompiled<TReceipt>

// Late-bound lookups so Date.now/uuid mocks installed after module load work.
const defaultCtx = { now: () => Date.now(), uuid: () => uuidv1() }

/**
 * Cycle-safe Redux execution primitive. It intentionally imports no selectors
 * or app entity modules, so hidden-store reminder writers can join the outbox
 * without entering the adapter selector graph during module initialization.
 */
export function executeReduxCommand<TReceipt = unknown>(
  _sourceCommand: unknown,
  compile: TReduxCommandCompiler<TReceipt>
): AppThunk<TReceipt | undefined> {
  return (dispatch, getState) => {
    const state = getState()
    const result = compile(state, defaultCtx)
    const patch = isCompiled(result) ? result.patch : result

    if (!isEmptyPatch(patch)) {
      appendDurableCommand(dispatch, state, makeResolvedPatchCommand(patch))
    }

    return isCompiled(result) ? result.receipt : undefined
  }
}

export function executeReduxDurableCommand(command: TDurableCommand): AppThunk {
  return (dispatch, getState) => {
    appendDurableCommand(dispatch, getState(), command)
  }
}

function appendDurableCommand(
  dispatch: AppDispatch,
  state: RootState,
  command: TDurableCommand
): void {
  const createdAt = defaultCtx.now()
  const patch = materializeCommand(state.data.current, command, createdAt)
  if (isEmptyPatch(patch)) return

  const entry: TOutboxEntry = {
    ...command,
    createdAt,
  }
  dispatch(appendClientOutboxEntry(entry))
}

function isEmptyPatch(patch: TNormalizedPatch): boolean {
  return Object.keys(patch).length === 0
}

function isCompiled<TReceipt>(
  value: TNormalizedPatch | TCompiled<TReceipt>
): value is TCompiled<TReceipt> {
  return 'patch' in value && 'receipt' in value
}
