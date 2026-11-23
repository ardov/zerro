import {
  isEntityOperation,
  validateEntityOperation,
} from '../../domain/zenmoney/operations'
import { parseZerroOperation } from '../../domain/zerro/operations/types'
/** Shared pure replica rules over durable base and outbox plus session-only redo. */
import {
  isPurgedByAmounts,
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
import { prepareCommand } from '../materialization'
import type { TCompiled } from '../../../types'

export type { TCommand } from '../materialization'
import { sanitizeCommandLabel } from '../materialization'

export type TOutboxState = {
  outbox: TCommand[]
  redo: TCommand[]
}

export type TStagedCompiledCommand<TReceipt> = {
  base: TDataStore
  current: TDataStore
  outbox: TCommand[]
  command: TCommand
  receipt: TReceipt | undefined
}

/** Validate the durable array shape now; materialization validates entity fields. */
export function parseCommandOutbox(value: unknown): TCommand[] {
  if (!Array.isArray(value)) throw new Error('Command outbox must be an array')

  return value.map((entry, index) => {
    if (!isRecord(entry))
      throw new Error(`Command outbox[${index}] must be an object`)
    if (
      !isFiniteNumber(entry.issuedAt) ||
      !Array.isArray(entry.operations) ||
      'patch' in entry ||
      'type' in entry
    )
      throw new Error(`Command outbox[${index}] uses an unsupported format`)
    entry.operations.forEach(operation => {
      if (!isRecord(operation) || typeof operation.type !== 'string')
        throw new Error('Invalid operation')
      if (isEntityOperation(operation as { type: string }))
        validateEntityOperation(operation as never)
      else parseZerroOperation(operation)
    })

    // The label is decoration over a durable command: an unrecognized one is
    // dropped, never a reason to fail the load and lose unsent work.
    const label = sanitizeCommandLabel(entry.label)
    const command = entry as unknown as TCommand
    if (label) return { ...command, label }
    if (command.label === undefined) return command
    const { label: _dropped, ...withoutLabel } = command
    return withoutLabel
  })
}

export function stageCompiledCommand<TReceipt>(
  base: TDataStore,
  outbox: readonly TCommand[],
  compiled: TCompiled<TReceipt>,
  issuedAt: number
): TStagedCompiledCommand<TReceipt> {
  const current = replayOutbox(base, outbox)
  const command = prepareCommand(current, compiled.operations, issuedAt)
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

export function editOutbox(
  outbox: readonly TCommand[],
  command: TCommand | null,
  replacing: boolean
): TOutboxState {
  const prefix = replacing ? outbox.slice(0, -1) : outbox
  return command
    ? appendOutbox(prefix, command)
    : { outbox: [...prefix], redo: [] }
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

/** Undo the suffix after keepCount and order redo exactly as repeated single undos would. */
export function undoOutboxTo(
  outbox: readonly TCommand[],
  redo: readonly TCommand[],
  keepCount: number
): TOutboxState {
  if (
    !Number.isInteger(keepCount) ||
    keepCount < 0 ||
    keepCount > outbox.length
  )
    throw new Error('Outbox undo target is out of range')

  return {
    outbox: outbox.slice(0, keepCount),
    redo: [...redo, ...outbox.slice(keepCount).reverse()],
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

/** Replay only the sent prefix over canonical base. Omit deletions for entities the server never saw. */
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
  const isAbsentFromBase = (key: TDataEntityKey, id: string | number) =>
    (base[key] as Record<string | number, unknown>)[id] === undefined

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
      { id: string | number; deleted?: boolean } | undefined
    >
    const entities = [...ids].flatMap(id => {
      const entity = currentById[id]
      if (!entity) return []
      if (
        isAbsentFromBase(key, id) &&
        (entity.deleted ||
          (key === 'transaction' && isPurgedByAmounts(current.transaction[id])))
      )
        return []
      return [entity]
    })
    if (entities.length) transport[key] = entities as never
  })

  const deletions = [...deleted.values()]
    .flatMap(byId => [...byId.values()])
    .filter(item => !isAbsentFromBase(item.object, item.id))
  if (deletions.length) transport.deletion = deletions

  return Object.keys(transport).length ? transport : undefined
}

/** Append one command only when current already equals the replay of the old outbox. Undo, redo, and rebase replay from base. */
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
