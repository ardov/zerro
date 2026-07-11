import type { TNormalizedPatch } from '../types'
import { replay } from '../zenmoney'
import type { TDataStore } from '../zenmoney/store'

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
