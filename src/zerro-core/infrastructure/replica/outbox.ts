import type { TNormalizedPatch } from '../../types'
import {
  isCommandRebaseSafe,
  materializeCommand,
  type TCommand,
} from '../../application/materializer'
import { applyPatch } from '../../domain/zenmoney'
import type { TDataStore } from '../../domain/zenmoney/store'

export type { TCommand } from '../../application/materializer'

export type TOutboxState = {
  outbox: TCommand[]
  outboxHead: number
}

export function clampOutboxHead(
  outboxHead: number,
  outboxLength: number
): number {
  return Math.max(0, Math.min(outboxHead, outboxLength))
}

export function getPendingOutbox(
  outbox: readonly TCommand[],
  outboxHead: number
): TCommand[] {
  return outbox.slice(0, clampOutboxHead(outboxHead, outbox.length))
}

export function appendOutbox(
  outbox: readonly TCommand[],
  outboxHead: number,
  command: TCommand
): TOutboxState {
  const nextOutbox = getPendingOutbox(outbox, outboxHead)
  nextOutbox.push(command)
  return { outbox: nextOutbox, outboxHead: nextOutbox.length }
}

export function replayOutbox(
  base: TDataStore,
  outbox: readonly TCommand[],
  outboxHead: number
): TDataStore {
  return materializeOutbox(base, outbox, outboxHead).current
}

export function getMaterializedOutboxPatches(
  base: TDataStore,
  outbox: readonly TCommand[],
  outboxHead: number,
  changedAt?: number
): TNormalizedPatch[] {
  return materializeOutbox(base, outbox, outboxHead, changedAt).patches
}

/**
 * Advance `current` by one command without replaying from base. Callers
 * must hold the invariant that `current` already equals the replay of the
 * command prefix up to the current head; append then only needs this command's
 * effect. Undo, redo, and base changes still require a full `replayOutbox`.
 */
export function applyOutboxCommand(
  current: TDataStore,
  command: TCommand
): TDataStore {
  return applyPatch(current, materializeCommand(current, command))
}

export function isOutboxCommandRebaseSafe(command: TCommand): boolean {
  return isCommandRebaseSafe(command)
}

function materializeOutbox(
  base: TDataStore,
  outbox: readonly TCommand[],
  outboxHead: number,
  changedAt?: number
): { current: TDataStore; patches: TNormalizedPatch[] } {
  let current = base
  const patches: TNormalizedPatch[] = []

  getPendingOutbox(outbox, outboxHead).forEach(command => {
    const patch = materializeCommand(
      current,
      command,
      changedAt ?? command.issuedAt
    )
    patches.push(patch)
    current = applyPatch(current, patch)
  })

  return { current, patches }
}
