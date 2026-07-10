import type { TDataStore } from '../zenmoney/store'
import type { TCompiled, TCoreContext, TNormalizedPatch } from '../types'
import { replay } from '../zenmoney'
import { materializePatch, type TMaterializedPatch } from '../materializer'

export type TOutboxEntry<TCommand = unknown> = {
  id: string
  command: TCommand
  intentPatch: TNormalizedPatch
  appliedPatch: TNormalizedPatch
  materializerVersion: number
  createdAt: number
}

export type TZerroEngineState<TCommand = unknown> = {
  base: TDataStore
  baseServerTimestamp?: number
  outbox: TOutboxEntry<TCommand>[]
  outboxHead: number
  inbox?: TNormalizedPatch | null
}

export type TZerroEngineInput<TCommand = unknown> = {
  base: TDataStore
  baseServerTimestamp?: number
  outbox?: TOutboxEntry<TCommand>[]
  outboxHead?: number
  inbox?: TNormalizedPatch | null
  ctx: TCoreContext
}

export type TCommandCompiler<TCommand, TReceipt = unknown> = (
  data: TDataStore,
  command: TCommand,
  ctx: TCoreContext
) => TNormalizedPatch | TCompiled<TReceipt>

export type TExecuteResult<TCommand, TReceipt = unknown> = {
  entry: TOutboxEntry<TCommand>
  receipt?: TReceipt
}

export function createZerroEngine<TCommand = unknown>(
  input: TZerroEngineInput<TCommand>
) {
  let state: TZerroEngineState<TCommand> = {
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

  function getState(): TZerroEngineState<TCommand> {
    return {
      ...state,
      outbox: [...state.outbox],
    }
  }

  function getCurrent(): TDataStore {
    return replay(
      state.base,
      state.outbox.slice(0, state.outboxHead).map(entry => entry.appliedPatch)
    )
  }

  function getPendingOutbox(): TOutboxEntry<TCommand>[] {
    return state.outbox.slice(0, state.outboxHead)
  }

  function execute<TReceipt = unknown>(
    command: TCommand,
    compile: TCommandCompiler<TCommand, TReceipt>
  ): TExecuteResult<TCommand, TReceipt> {
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
    command: TCommand,
    intentPatch: TNormalizedPatch
  ): TOutboxEntry<TCommand> {
    return appendMaterialized(
      command,
      materializePatch(getCurrent(), intentPatch)
    )
  }

  function appendMaterialized(
    command: TCommand,
    materialized: TMaterializedPatch
  ): TOutboxEntry<TCommand> {
    const outbox = state.outbox.slice(0, state.outboxHead)
    const entry: TOutboxEntry<TCommand> = {
      id: input.ctx.uuid(),
      command,
      intentPatch: materialized.intentPatch,
      appliedPatch: materialized.appliedPatch,
      materializerVersion: materialized.materializerVersion,
      createdAt: input.ctx.now(),
    }

    outbox.push(entry)
    state = {
      ...state,
      outbox,
      outboxHead: outbox.length,
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

function clampOutboxHead(outboxHead: number, outboxLength: number): number {
  return Math.max(0, Math.min(outboxHead, outboxLength))
}
