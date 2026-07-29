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
  intentPatchKeys,
  type TDataEntityKey,
  type TDataStore,
  type TDeletionObject,
  type TNormalizedPatch,
} from '../../domain/zenmoney'
import { issuePatch } from '../materialization'
import type { TCompiled } from '../../../types'

export type { TCommand } from '../materialization'

export type TOutboxState = {
  outbox: TCommand[]
  redo: TCommand[]
}

export type TStagedCompiledCommand<TReceipt> = {
  base: TDataStore
  current: TDataStore
  outbox: TCommand[]
  command: TCommand
  receipt: TReceipt
}

/**
 * Validates the durable command-array shape without importing a runtime
 * persistence format. Entity fields are validated when materialized.
 */
export function parseCommandOutbox(value: unknown): TCommand[] {
  if (!Array.isArray(value)) throw new Error('Command outbox must be an array')

  value.forEach((entry, index) => {
    if (!isRecord(entry))
      throw new Error(`Command outbox[${index}] must be an object`)
    if (entry.type !== 'patch' || !isFiniteNumber(entry.issuedAt))
      throw new Error(`Command outbox[${index}] metadata is invalid`)
    if (!isRecord(entry.patch))
      throw new Error(`Command outbox[${index}].patch must be an object`)

    Object.entries(entry.patch).forEach(([key, entities]) => {
      if (!(intentPatchKeys as readonly string[]).includes(key))
        throw new Error(`Command outbox[${index}].patch.${key} is invalid`)
      if (
        !Array.isArray(entities) ||
        entities.some(
          entity =>
            !isRecord(entity) ||
            (typeof entity.id !== 'string' && typeof entity.id !== 'number')
        )
      )
        throw new Error(`Command outbox[${index}].patch.${key} is invalid`)
      if (
        key === 'deletion' &&
        entities.some(
          entity =>
            !isRecord(entity) ||
            !dataEntityKeys.includes(entity.object as TDataEntityKey)
        )
      )
        throw new Error(`Command outbox[${index}].patch.${key} is invalid`)
    })
  })

  return value as TCommand[]
}

/** Issues and appends one compiled semantic intent against the latest replay. */
export function stageCompiledCommand<TReceipt>(
  base: TDataStore,
  outbox: readonly TCommand[],
  compiled: TCompiled<TReceipt>,
  issuedAt: number
): TStagedCompiledCommand<TReceipt> {
  const current = replayOutbox(base, outbox)
  const command = issuePatch(current, compiled.patch, issuedAt)
  const materialized = materializeCommand(current, command)
  if (!Object.keys(materialized).length)
    throw new Error('Compiled command did not change the snapshot')
  const next = appendOutbox(outbox, command).outbox
  return {
    base,
    current: applyPatch(current, materialized),
    outbox: next,
    command,
    receipt: compiled.receipt,
  }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
