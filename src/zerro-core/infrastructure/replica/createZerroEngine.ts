import type { TDataStore } from '../../domain/zenmoney/store'
import {
  isCompiled,
  type TCompiled,
  type TCoreContext,
  type TIntentPatch,
} from '../../types'
import { issuePatch, type TCommand } from '../../application/materializer'
import {
  appendOutbox,
  clampOutboxHead,
  getPendingOutbox as selectPendingOutbox,
  replayOutbox,
} from './outbox'

export type { TCommand } from '../../application/materializer'

export type TZerroEngineState = {
  base: TDataStore
  baseServerTimestamp?: number
  outbox: TCommand[]
  outboxHead: number
}

export type TZerroEngineInput = {
  base: TDataStore
  baseServerTimestamp?: number
  outbox?: TCommand[]
  outboxHead?: number
  ctx: TCoreContext
}

export type TCommandCompiler<TCommand, TReceipt = unknown> = (
  data: TDataStore,
  command: TCommand,
  ctx: TCoreContext
) => TIntentPatch | TCompiled<TReceipt>

export type TExecuteResult<TReceipt = unknown> = {
  command: TCommand
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

  function getPendingOutbox(): TCommand[] {
    return selectPendingOutbox(state.outbox, state.outboxHead)
  }

  function execute<TSourceCommand, TReceipt = unknown>(
    sourceCommand: TSourceCommand,
    compile: TCommandCompiler<TSourceCommand, TReceipt>
  ): TExecuteResult<TReceipt> {
    const current = getCurrent()
    const result = compile(current, sourceCommand, input.ctx)
    const patch = isCompiled(result) ? result.patch : result
    const command = appendCommand(issuePatch(current, patch, input.ctx.now()))

    if (isCompiled(result)) {
      return { command, receipt: result.receipt }
    }
    return { command }
  }

  function executeCompiled(patch: TIntentPatch): TCommand {
    return appendCommand(issuePatch(getCurrent(), patch, input.ctx.now()))
  }

  function appendCommand(command: TCommand): TCommand {
    const next = appendOutbox(state.outbox, state.outboxHead, command)
    state = {
      ...state,
      ...next,
    }
    return command
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
