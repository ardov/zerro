import type { TNormalizedPatch } from '../../types'
import { applyPatch, replay } from '../../domain/zenmoney'
import type { TDataStore } from '../../domain/zenmoney/store'

export type TOutboxEntry<TCommand = unknown> = {
  id: string
  command: TCommand
  intentPatch: TNormalizedPatch
  appliedPatch: TNormalizedPatch
  materializerVersion: number
  createdAt: number
}

export type TOutboxState<TCommand = unknown> = {
  outbox: TOutboxEntry<TCommand>[]
  outboxHead: number
}

export function clampOutboxHead(
  outboxHead: number,
  outboxLength: number
): number {
  return Math.max(0, Math.min(outboxHead, outboxLength))
}

export function getPendingOutbox<TCommand>(
  outbox: readonly TOutboxEntry<TCommand>[],
  outboxHead: number
): TOutboxEntry<TCommand>[] {
  return outbox.slice(0, clampOutboxHead(outboxHead, outbox.length))
}

export function appendOutbox<TCommand>(
  outbox: readonly TOutboxEntry<TCommand>[],
  outboxHead: number,
  entry: TOutboxEntry<TCommand>
): TOutboxState<TCommand> {
  const nextOutbox = getPendingOutbox(outbox, outboxHead)
  nextOutbox.push(entry)
  return { outbox: nextOutbox, outboxHead: nextOutbox.length }
}

export function replayOutbox<TCommand>(
  base: TDataStore,
  outbox: readonly TOutboxEntry<TCommand>[],
  outboxHead: number
): TDataStore {
  return replay(
    base,
    getPendingOutbox(outbox, outboxHead).map(entry => entry.appliedPatch)
  )
}

/**
 * Advance `current` by one applied entry without replaying from base. Callers
 * must hold the invariant that `current` already equals the replay of the
 * applied prefix up to the current head; append then only needs this entry's
 * effect. Undo, redo, and base changes still require a full `replayOutbox`.
 */
export function applyOutboxEntry<TCommand>(
  current: TDataStore,
  entry: TOutboxEntry<TCommand>
): TDataStore {
  return applyPatch(current, entry.appliedPatch)
}
