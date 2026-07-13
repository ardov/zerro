import type { TDataStore } from '../../domain/zenmoney/store'
import type { TCompiled, TCoreContext, TNormalizedPatch } from '../../types'
import {
  materializePatch,
  type TMaterializedPatch,
} from '../../application/materializer'
import {
  appendOutbox,
  clampOutboxHead,
  getPendingOutbox as selectPendingOutbox,
  replayOutbox,
  type TOutboxEntry,
} from './outbox'

export type { TOutboxEntry } from './outbox'

export type TZerroEngineState = {
  base: TDataStore
  baseServerTimestamp?: number
  outbox: TOutboxEntry[]
  outboxHead: number
  inbox?: TNormalizedPatch | null
}

export type TZerroEngineInput = {
  base: TDataStore
  baseServerTimestamp?: number
  outbox?: TOutboxEntry[]
  outboxHead?: number
  inbox?: TNormalizedPatch | null
  ctx: TCoreContext
}

export type TCommandCompiler<TCommand, TReceipt = unknown> = (
  data: TDataStore,
  command: TCommand,
  ctx: TCoreContext
) => TNormalizedPatch | TCompiled<TReceipt>

export type TExecuteResult<TReceipt = unknown> = {
  entry: TOutboxEntry
  receipt?: TReceipt
}

export function createZerroEngine(input: TZerroEngineInput) {
  let state: TZerroEngineState = {
    base: input.base,
    baseServerTimestamp: input.baseServerTimestamp,
    outbox: input.outbox ? [...input.outbox] : [],
    outboxHead: clampOutboxHead(
      input.outboxHead ?? input.outbox?.length ?? 0,
      input.outbox?.length ?? 0
    ),
    inbox: input.inbox ?? null,
  }

  return {
    getState,
    getCurrent,
    getPendingOutbox,
    execute,
    executeCompiled,
    undo,
    redo,
  }

  function getState(): TZerroEngineState {
    return {
      ...state,
      outbox: [...state.outbox],
    }
  }

  function getCurrent(): TDataStore {
    return replayOutbox(state.base, state.outbox, state.outboxHead)
  }

  function getPendingOutbox(): TOutboxEntry[] {
    return selectPendingOutbox(state.outbox, state.outboxHead)
  }

  function execute<TCommand, TReceipt = unknown>(
    command: TCommand,
    compile: TCommandCompiler<TCommand, TReceipt>
  ): TExecuteResult<TReceipt> {
    const current = getCurrent()
    const result = compile(current, command, input.ctx)
    const intentPatch = isCompiled(result) ? result.patch : result
    const entry = appendMaterialized(
      command,
      materializePatch(current, intentPatch)
    )

    if (isCompiled(result)) {
      return { entry, receipt: result.receipt }
    }
    return { entry }
  }

  function executeCompiled(
    command: unknown,
    intentPatch: TNormalizedPatch
  ): TOutboxEntry {
    return appendMaterialized(
      command,
      materializePatch(getCurrent(), intentPatch)
    )
  }

  function appendMaterialized(
    command: unknown,
    materialized: TMaterializedPatch
  ): TOutboxEntry {
    const entry: TOutboxEntry = {
      id: input.ctx.uuid(),
      command,
      intentPatch: materialized.intentPatch,
      appliedPatch: materialized.appliedPatch,
      materializerVersion: materialized.materializerVersion,
      createdAt: input.ctx.now(),
    }

    const next = appendOutbox(state.outbox, state.outboxHead, entry)
    state = {
      ...state,
      ...next,
    }
    return entry
  }

  function undo(): boolean {
    if (state.outboxHead <= 0) return false
    state = {
      ...state,
      outboxHead: state.outboxHead - 1,
    }
    return true
  }

  function redo(): boolean {
    if (state.outboxHead >= state.outbox.length) return false
    state = {
      ...state,
      outboxHead: state.outboxHead + 1,
    }
    return true
  }
}

function isCompiled<TReceipt>(
  value: TNormalizedPatch | TCompiled<TReceipt>
): value is TCompiled<TReceipt> {
  return 'patch' in value && 'receipt' in value
}
