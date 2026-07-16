import type { TNormalizedPatch } from '../../types'
import type { TDataStore } from '../../domain/zenmoney/store'
import {
  isDeletedTransaction,
  transactionEditableFields,
  transactionRecreateFields,
  type TTransactionEditablePatch,
  type TTransactionId,
  type TTransactionRecreatePatch,
} from '../../domain/zenmoney/transactions'

export type TTransactionsPatchCommand = {
  type: 'transactions.patch'
  payload: {
    ids: TTransactionId[]
    set: TTransactionEditablePatch
  }
}

export type TTransactionRecreateCommand = {
  type: 'transaction.recreate'
  payload: {
    sourceId: TTransactionId
    replacementId: TTransactionId
    set: TTransactionRecreatePatch
  }
}

/**
 * Transitional command for behavior whose narrow durable form is not migrated
 * yet. The resolved patch is replayable, but does not provide field-level
 * rebase semantics.
 */
export type TResolvedPatchCommand = {
  type: 'patch'
  payload: TNormalizedPatch
}

export type TDurableCommand =
  | TTransactionsPatchCommand
  | TTransactionRecreateCommand
  | TResolvedPatchCommand

export function makeResolvedPatchCommand(
  patch: TNormalizedPatch
): TResolvedPatchCommand {
  return { type: 'patch', payload: patch }
}

/** Materializes one durable command against the latest local snapshot. */
export function materializeCommand(
  snapshot: TDataStore,
  command: TDurableCommand,
  changedAt: number
): TNormalizedPatch {
  switch (command.type) {
    case 'transactions.patch':
      return materializeTransactionsPatch(snapshot, command, changedAt)
    case 'transaction.recreate':
      return materializeTransactionRecreate(snapshot, command, changedAt)
    case 'patch':
      return refreshPatchTimestamps(snapshot, command.payload, changedAt)
  }
}

/**
 * Whether canonical data already represents the command. Resolved legacy
 * patches retain whole-batch acknowledgement until they gain narrow commands.
 */
export function isCommandSatisfied(
  canonical: TDataStore,
  command: TDurableCommand
): boolean {
  if (command.type === 'patch') return true

  if (command.type === 'transaction.recreate') {
    const source = canonical.transaction[command.payload.sourceId]
    if (!source || source.deleted) return true

    const replacement = canonical.transaction[command.payload.replacementId]
    return (
      isDeletedTransaction(source) &&
      !!replacement &&
      !replacement.deleted &&
      patchIsApplied(replacement, command.payload.set)
    )
  }

  return command.payload.ids.every(id => {
    const transaction = canonical.transaction[id]
    if (!transaction || transaction.deleted) return true
    return patchIsApplied(
      transaction,
      pickTransactionEditablePatch(command.payload.set)
    )
  })
}

function materializeTransactionRecreate(
  snapshot: TDataStore,
  command: TTransactionRecreateCommand,
  changedAt: number
): TNormalizedPatch {
  const source = snapshot.transaction[command.payload.sourceId]
  if (!source || source.deleted) return {}

  const replacement = snapshot.transaction[command.payload.replacementId]
  const transaction = []

  if (!isDeletedTransaction(source)) {
    transaction.push({
      ...source,
      income: 0.00001,
      outcome: 0.00001,
      changed: nextChanged(changedAt, source.changed),
    })
  }

  if (!replacement || !patchIsApplied(replacement, command.payload.set)) {
    transaction.push({
      ...(replacement || source),
      ...command.payload.set,
      id: command.payload.replacementId,
      deleted: false,
      changed: replacement
        ? nextChanged(changedAt, replacement.changed)
        : changedAt,
    })
  }

  return transaction.length ? { transaction } : {}
}

function materializeTransactionsPatch(
  snapshot: TDataStore,
  command: TTransactionsPatchCommand,
  changedAt: number
): TNormalizedPatch {
  const set = pickTransactionEditablePatch(command.payload.set)
  if (!Object.keys(set).length) return {}

  const transaction = command.payload.ids.flatMap(id => {
    const current = snapshot.transaction[id]
    // Missing and server-deleted transactions are terminal no-ops on rebase.
    if (!current || current.deleted) return []
    if (patchIsApplied(current, set)) return []

    return [
      {
        ...current,
        ...set,
        changed: nextChanged(changedAt, current.changed),
      },
    ]
  })

  return transaction.length ? { transaction } : {}
}

function pickTransactionEditablePatch(
  patch: TTransactionEditablePatch
): TTransactionEditablePatch {
  return Object.fromEntries(
    Object.entries(patch).filter(([key]) => isTransactionEditableField(key))
  ) as TTransactionEditablePatch
}

function patchIsApplied(
  current: Record<string, unknown>,
  patch: TTransactionEditablePatch
): boolean {
  return Object.entries(patch).every(([key, value]) =>
    transactionValuesEqual(key, current[key], value)
  )
}

function transactionValuesEqual(
  key: string,
  left: unknown,
  right: unknown
): boolean {
  // ZenMoney canonicalizes an empty transaction comment to null.
  if (key === 'comment') return (left ?? '') === (right ?? '')

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((value, index) => Object.is(value, right[index]))
    )
  }
  return Object.is(left, right)
}

function refreshPatchTimestamps(
  snapshot: TDataStore,
  patch: TNormalizedPatch,
  changedAt: number
): TNormalizedPatch {
  const result: TNormalizedPatch = { ...patch }
  const entityKeys = [
    'instrument',
    'company',
    'user',
    'merchant',
    'account',
    'tag',
    'budget',
    'reminder',
    'reminderMarker',
    'transaction',
  ] as const

  entityKeys.forEach(key => {
    const entities = patch[key]
    if (!entities) return
    const currentById = snapshot[key] as Record<
      string | number,
      { changed?: number } | undefined
    >
    // The dynamic entity union is localized to this transport/replay seam.
    ;(result[key] as Array<{ id: string | number; changed: number }>) =
      entities.map(entity => ({
        ...entity,
        changed: nextChanged(changedAt, currentById[entity.id]?.changed),
      })) as Array<{ id: string | number; changed: number }>
  })

  if (patch.deletion) {
    result.deletion = patch.deletion.map(entity => ({
      ...entity,
      stamp: Math.max(changedAt, entity.stamp),
    }))
  }

  return result
}

function nextChanged(changedAt: number, currentChanged = 0): number {
  // ZenMoney compares second-resolution entity versions strictly.
  return Math.max(changedAt, currentChanged + 1000)
}

export function isTransactionEditableField(
  value: string
): value is (typeof transactionEditableFields)[number] {
  return (transactionEditableFields as readonly string[]).includes(value)
}

export function isTransactionRecreateField(
  value: string
): value is (typeof transactionRecreateFields)[number] {
  return (transactionRecreateFields as readonly string[]).includes(value)
}
