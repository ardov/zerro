import type { TMsTime } from '../../domain/zenmoney/primitives'
import type { TDataStore, TDiff } from '../../domain/zenmoney/store'
import {
  transactionEditableFields,
  type TTransactionPatch,
} from '../../domain/zenmoney/transactions'
import type { TAccountPatch } from '../../domain/zenmoney/accounts'
import type { TMerchantPatch } from '../../domain/zenmoney/merchants'
import type { TReminderPatch } from '../../domain/zenmoney/reminders'
import type { TTagPatch } from '../../domain/zenmoney/tags'

export type TIntentPatch = Omit<
  TDiff,
  | 'serverTimestamp'
  | 'account'
  | 'merchant'
  | 'tag'
  | 'reminder'
  | 'transaction'
> & {
  account?: TAccountPatch[]
  merchant?: TMerchantPatch[]
  tag?: TTagPatch[]
  reminder?: TReminderPatch[]
  transaction?: TTransactionPatch[]
}

export type TCommand = {
  type: 'patch'
  issuedAt: TMsTime
  patch: TIntentPatch
}

export function issuePatch(
  patch: TDiff | TIntentPatch,
  issuedAt: TMsTime
): TCommand {
  const { serverTimestamp: _, ...intentPatch } = patch as TDiff
  return { type: 'patch', issuedAt, patch: intentPatch }
}

/** Materializes one command against the latest local snapshot. */
export function materializeCommand(
  snapshot: TDataStore,
  command: TCommand,
  changedAt: TMsTime = command.issuedAt
): TDiff {
  return materializeIntentPatch(snapshot, command.patch, changedAt)
}

/**
 * Transitional safety check for automatic sync. Sparse transaction edits can
 * rebase without overwriting unrelated fields; resolved full entity intents
 * wait for explicit sync until their compilers become sparse.
 */
export function isCommandRebaseSafe(command: TCommand): boolean {
  const keys = Object.keys(command.patch)
  if (keys.length !== 1 || keys[0] !== 'transaction') return false

  const allowed = new Set<string>(['id', ...transactionEditableFields])
  return !!command.patch.transaction?.every(transaction =>
    Object.keys(transaction).every(key => allowed.has(key))
  )
}

function materializeIntentPatch(
  snapshot: TDataStore,
  patch: TIntentPatch,
  changedAt: TMsTime
): TDiff {
  const result: TDiff = { ...patch } as TDiff
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
    const intents = patch[key] as
      | Array<{ id: string | number; changed?: number; deleted?: boolean }>
      | undefined
    if (!intents) return

    const currentById = snapshot[key] as Record<
      string | number,
      | ({ id: string | number; changed?: number; deleted?: boolean } & Record<
          string,
          unknown
        >)
      | undefined
    >

    const entities = intents.flatMap(intent => {
      const current = currentById[intent.id]
      if (key === 'transaction' && current?.deleted) return []

      const { changed: _ignored, ...fields } = intent
      if (current) {
        const applicableFields =
          key === 'transaction' ? pickTransactionPatch(fields) : fields
        if (patchIsApplied(current, applicableFields)) return []
        return [
          {
            ...current,
            ...applicableFields,
            changed: nextChanged(changedAt, current.changed),
          },
        ]
      }

      // Until factory-backed upsert lands, only already-complete legacy intent
      // can create a missing entity. Sparse updates remain terminal no-ops.
      if (intent.changed === undefined) return []
      return [{ ...fields, changed: changedAt }]
    })

    if (entities.length) {
      ;(result[key] as Array<Record<string, unknown>>) = entities
    } else {
      delete result[key]
    }
  })

  if (patch.deletion) {
    if (patch.deletion.length) {
      result.deletion = patch.deletion.map(entity => ({
        ...entity,
        stamp: Math.max(changedAt, entity.stamp),
      }))
    } else {
      delete result.deletion
    }
  }

  return result
}

function pickTransactionPatch(
  fields: Record<string, unknown>
): Record<string, unknown> {
  const allowed = new Set<string>(transactionEditableFields)
  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => key === 'id' || allowed.has(key))
  )
}

function patchIsApplied(
  current: Record<string, unknown>,
  patch: Record<string, unknown>
): boolean {
  return Object.entries(patch).every(([key, value]) =>
    valuesEqual(key, current[key], value)
  )
}

function valuesEqual(key: string, left: unknown, right: unknown): boolean {
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

function nextChanged(changedAt: number, currentChanged = 0): number {
  // ZenMoney compares second-resolution entity versions strictly.
  return Math.max(changedAt, currentChanged + 1000)
}
