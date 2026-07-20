/**
 * Engine core: the pure replica operations over durable `base + outbox` and
 * session-only `redo`.
 *
 * Every append, undo, redo, replay, and transport rule lives here as a plain
 * function, so the only runtime-specific part left is who owns the state. In
 * this app Redux owns it (`store/data/slice.ts`); a future standalone package
 * wraps these same functions. Do not grow a second implementation of append,
 * replay or history-stack rules beside this file.
 */
import {
  materializeCommand,
  materializePrimaryCommand,
  type TCommand,
} from '../materialization'
import {
  applyPatch,
  dataEntityKeys,
  type TDataEntityKey,
  type TDataStore,
  type TDeletionObject,
  type TNormalizedPatch,
} from '../../domain/zenmoney'

export type { TCommand } from '../materialization'

export type TOutboxState = {
  outbox: TCommand[]
  redo: TCommand[]
}

export function appendOutbox(
  outbox: readonly TCommand[],
  command: TCommand
): TOutboxState {
  return { outbox: [...outbox, command], redo: [] }
}

export function undoOutbox(
  outbox: readonly TCommand[],
  redo: readonly TCommand[]
): TOutboxState {
  const command = outbox[outbox.length - 1]
  if (!command) return { outbox: [...outbox], redo: [...redo] }
  return {
    outbox: outbox.slice(0, -1),
    redo: [...redo, command],
  }
}

export function redoOutbox(
  outbox: readonly TCommand[],
  redo: readonly TCommand[]
): TOutboxState {
  const command = redo[redo.length - 1]
  if (!command) return { outbox: [...outbox], redo: [...redo] }
  return {
    outbox: [...outbox, command],
    redo: redo.slice(0, -1),
  }
}

export function replayOutbox(
  base: TDataStore,
  outbox: readonly TCommand[]
): TDataStore {
  return materializeOutbox(base, outbox).current
}

export function getMaterializedOutboxPatches(
  base: TDataStore,
  outbox: readonly TCommand[]
): TNormalizedPatch[] {
  return materializeOutbox(base, outbox).patches
}

/**
 * Replays the sent command prefix independently from UI `current` and returns
 * the final full primary entities plus surviving deletions for transport.
 */
export function buildOutboxTransport(
  base: TDataStore,
  outbox: readonly TCommand[],
  sentAt: number
): TNormalizedPatch | undefined {
  if (!outbox.length) return undefined

  let current = base
  const touched = new Map<TDataEntityKey, Set<string | number>>()
  const deleted = new Map<
    TDataEntityKey,
    Map<string | number, TDeletionObject>
  >()

  outbox.forEach(command => {
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
 * durable outbox; append then only needs this command's effect. Undo, redo,
 * and base changes still require a full `replayOutbox`.
 */
export function applyOutboxCommand(
  current: TDataStore,
  command: TCommand
): TDataStore {
  return applyPatch(current, materializeCommand(current, command))
}

function materializeOutbox(
  base: TDataStore,
  outbox: readonly TCommand[]
): { current: TDataStore; patches: TNormalizedPatch[] } {
  let current = base
  const patches: TNormalizedPatch[] = []

  outbox.forEach(command => {
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
