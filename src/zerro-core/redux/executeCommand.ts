import { v1 as uuidv1 } from 'uuid'
import type { AppThunk, RootState } from 'store'
import { appendClientOutboxEntry } from 'store/data'

import type { TOutboxEntry } from '../infrastructure/replica/outbox'
import { materializePatch } from '../application/materializer'
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
export function executeReduxCommand<TCommand, TReceipt = unknown>(
  command: TCommand,
  compile: TReduxCommandCompiler<TReceipt>
): AppThunk<TReceipt | undefined> {
  return (dispatch, getState) => {
    const state = getState()
    const result = compile(state, defaultCtx)
    const patch = isCompiled(result) ? result.patch : result

    if (!isEmptyPatch(patch)) {
      const materialized = materializePatch(state.data.current, patch)
      const entry: TOutboxEntry<TCommand> = {
        id: defaultCtx.uuid(),
        command,
        intentPatch: materialized.intentPatch,
        appliedPatch: materialized.appliedPatch,
        materializerVersion: materialized.materializerVersion,
        createdAt: defaultCtx.now(),
      }
      dispatch(appendClientOutboxEntry(entry))
    }

    return isCompiled(result) ? result.receipt : undefined
  }
}

function isEmptyPatch(patch: TNormalizedPatch): boolean {
  return Object.keys(patch).length === 0
}

function isCompiled<TReceipt>(
  value: TNormalizedPatch | TCompiled<TReceipt>
): value is TCompiled<TReceipt> {
  return 'patch' in value && 'receipt' in value
}
