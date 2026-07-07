import type { TDataStore } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../types'
import { replay } from '../zenmoney'

export type TOutboxEntry<TCommand = unknown> = {
  id: string
  command: TCommand
  patch: TNormalizedPatch
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
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
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
      state.outbox.slice(0, state.outboxHead).map(entry => entry.patch)
    )
  }

  function getPendingOutbox(): TOutboxEntry<TCommand>[] {
    return state.outbox.slice(0, state.outboxHead)
  }

  function executeCompiled(
    command: TCommand,
    patch: TNormalizedPatch
  ): TOutboxEntry<TCommand> {
    const outbox = state.outbox.slice(0, state.outboxHead)
    const entry: TOutboxEntry<TCommand> = {
      id: input.ctx.uuid(),
      command,
      patch,
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

function clampOutboxHead(outboxHead: number, outboxLength: number): number {
  return Math.max(0, Math.min(outboxHead, outboxLength))
}
