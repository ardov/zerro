import {
  materializeCommand,
  materializePrimaryCommand,
  type TCommand,
} from '../../application/materializer'
import { applyPatch } from '../../domain/zenmoney'
import type {
  TDataStore,
  TDataEntityKey,
  TDeletionObject,
  TNormalizedPatch,
} from '../../domain/zenmoney/store'
import { dataEntityKeys } from '../../domain/zenmoney/store'

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
  outboxHead: number
): TNormalizedPatch[] {
  return materializeOutbox(base, outbox, outboxHead).patches
}

/**
 * Replays the sent command prefix independently from UI `current` and returns
 * the final full primary entities plus surviving deletions for transport.
 */
export function buildOutboxTransport(
  base: TDataStore,
  outbox: readonly TCommand[],
  outboxHead: number,
  sentAt: number
): TNormalizedPatch | undefined {
  const commands = getPendingOutbox(outbox, outboxHead)
  if (!commands.length) return undefined

  let current = base
  const touched = new Map<TDataEntityKey, Set<string | number>>()
  const deleted = new Map<
    TDataEntityKey,
    Map<string | number, TDeletionObject>
  >()

  commands.forEach(command => {
    const patch = materializePrimaryCommand(current, command, sentAt)

    patch.deletion?.forEach(item => {
      const key = item.object
      touched.get(key)?.delete(item.id)
      getOrCreate(deleted, key, () => new Map()).set(item.id, item)
    })

    dataEntityKeys.forEach(key => {
      const entities = patch[key]
      if (!entities) return
      entities.forEach(entity => {
        getOrCreate(touched, key, () => new Set()).add(entity.id)
        deleted.get(key)?.delete(entity.id)
      })
    })

    current = applyPatch(current, patch)
  })

  const transport: TNormalizedPatch = {}
  dataEntityKeys.forEach(key => {
    const ids = touched.get(key)
    if (!ids?.size) return
    const currentById = current[key] as Record<
      string | number,
      { id: string | number } | undefined
    >
    const entities = [...ids].flatMap(id => {
      const entity = currentById[id]
      return entity ? [entity] : []
    })
    if (entities.length) transport[key] = entities as never
  })

  const deletions = [...deleted.values()].flatMap(byId => [...byId.values()])
  if (deletions.length) transport.deletion = deletions

  return Object.keys(transport).length ? transport : undefined
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

function materializeOutbox(
  base: TDataStore,
  outbox: readonly TCommand[],
  outboxHead: number
): { current: TDataStore; patches: TNormalizedPatch[] } {
  let current = base
  const patches: TNormalizedPatch[] = []

  getPendingOutbox(outbox, outboxHead).forEach(command => {
    const patch = materializeCommand(current, command)
    patches.push(patch)
    current = applyPatch(current, patch)
  })

  return { current, patches }
}

function getOrCreate<TKey, TValue>(
  map: Map<TKey, TValue>,
  key: TKey,
  create: () => TValue
): TValue {
  const existing = map.get(key)
  if (existing !== undefined) return existing
  const value = create()
  map.set(key, value)
  return value
}
