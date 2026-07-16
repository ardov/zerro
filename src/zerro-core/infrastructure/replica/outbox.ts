import type { TNormalizedPatch } from '../../types'
import {
  isCommandSatisfied,
  materializeCommand,
  type TDurableCommand,
} from '../../application/materializer'
import { applyPatch } from '../../domain/zenmoney'
import type { TDataStore } from '../../domain/zenmoney/store'

/** A durable command with only its replay timestamp added. */
export type TOutboxEntry = TDurableCommand & { createdAt: number }

export type TOutboxState = {
  outbox: TOutboxEntry[]
  outboxHead: number
}

export function clampOutboxHead(
  outboxHead: number,
  outboxLength: number
): number {
  return Math.max(0, Math.min(outboxHead, outboxLength))
}

export function getPendingOutbox(
  outbox: readonly TOutboxEntry[],
  outboxHead: number
): TOutboxEntry[] {
  return outbox.slice(0, clampOutboxHead(outboxHead, outbox.length))
}

export function appendOutbox(
  outbox: readonly TOutboxEntry[],
  outboxHead: number,
  entry: TOutboxEntry
): TOutboxState {
  const nextOutbox = getPendingOutbox(outbox, outboxHead)
  nextOutbox.push(entry)
  return { outbox: nextOutbox, outboxHead: nextOutbox.length }
}

export function replayOutbox(
  base: TDataStore,
  outbox: readonly TOutboxEntry[],
  outboxHead: number
): TDataStore {
  return materializeOutbox(base, outbox, outboxHead).current
}

export function getMaterializedOutboxPatches(
  base: TDataStore,
  outbox: readonly TOutboxEntry[],
  outboxHead: number,
  changedAt?: number
): TNormalizedPatch[] {
  return materializeOutbox(base, outbox, outboxHead, changedAt).patches
}

/**
 * Advance `current` by one command entry without replaying from base. Callers
 * must hold the invariant that `current` already equals the replay of the
 * command prefix up to the current head; append then only needs this entry's
 * effect. Undo, redo, and base changes still require a full `replayOutbox`.
 */
export function applyOutboxEntry(
  current: TDataStore,
  entry: TOutboxEntry
): TDataStore {
  return applyPatch(
    current,
    materializeCommand(current, entry, entry.createdAt)
  )
}

export function isOutboxEntrySatisfied(
  canonical: TDataStore,
  entry: TOutboxEntry
): boolean {
  return isCommandSatisfied(canonical, entry)
}

export function isOutboxEntryRebaseSafe(entry: TOutboxEntry): boolean {
  return (
    entry.type === 'transactions.patch' || entry.type === 'transaction.recreate'
  )
}

function materializeOutbox(
  base: TDataStore,
  outbox: readonly TOutboxEntry[],
  outboxHead: number,
  changedAt?: number
): { current: TDataStore; patches: TNormalizedPatch[] } {
  let current = base
  const patches: TNormalizedPatch[] = []

  getPendingOutbox(outbox, outboxHead).forEach(entry => {
    const patch = materializeCommand(
      current,
      entry,
      changedAt ?? entry.createdAt
    )
    patches.push(patch)
    current = applyPatch(current, patch)
  })

  return { current, patches }
}
