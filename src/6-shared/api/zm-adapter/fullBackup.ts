/**
 * Decode the complete file produced by Zerro's JSON exporter.
 *
 * This is a protocol adapter: it validates untrusted wire JSON, converts it
 * through the shared ZenMoney codec, then returns a normalized Core snapshot.
 * Structural rules that are about the data rather than the file — references,
 * tag cycles, cardinalities — belong to the store validator, which every
 * other source of a snapshot passes through as well.
 */
import { z } from 'zod'
import {
  applyPatch,
  createEmptyDataStore,
  eachReferenceIssue,
  validateDataStore,
} from '@/zerro-core/headless'
import { AccountType, type TDataStore, type TZmDiff } from '@/6-shared/types'

import { convertDiff } from './converters'
import {
  fullBackupCollectionsShape,
  knownWireValues,
  wireSchemas,
} from './schemas'

const fullBackupWireSchema = z
  .object({
    serverTimestamp: z.number().nonnegative(),
    // Unknown keys pass so a newer export stays importable; this is the one
    // that must not, because it is what tells an incremental diff from a
    // complete backup.
    deletion: z.never().optional(),
    ...fullBackupCollectionsShape,
  })
  .passthrough()

type TFullBackupWire = z.output<typeof fullBackupWireSchema>
type TWireRow = Record<string, unknown>

/** Fields a snapshot may carry that Zerro can read but cannot write back. */
const unwritableWireFields = ['merchant.mcc'] as const

export type TFullBackupWarning = {
  reason:
    | 'unknownField'
    | 'unknownValue'
    /** A field Zerro reads and understands but has no way to write back. */
    | 'unwritableField'
    | 'danglingReference'
  path: string
  count: number
}

export type TFullBackupParseResult =
  | { ok: true; store: TDataStore; warnings: TFullBackupWarning[] }
  | { ok: false; reason: 'unreadable' | 'notABackup' }

/** Parses a structurally valid backup without considering the current account. */
export function parseFullBackup(text: string): TFullBackupParseResult {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'unreadable' }
  }

  const parsed = fullBackupWireSchema.safeParse(value)
  if (!parsed.success || !hasUniqueRows(parsed.data)) {
    return { ok: false, reason: 'notABackup' }
  }

  const store = applyPatch(
    createEmptyDataStore(),
    convertDiff.toClient(parsed.data as TZmDiff)
  )
  if (!describesAnAccount(store) || !validateDataStore(store).ok) {
    return { ok: false, reason: 'notABackup' }
  }

  return { ok: true, store, warnings: collectWarnings(parsed.data, store) }
}

/**
 * A complete export always describes a live account. The store validator
 * deliberately accepts the half-empty shape of a replica that is still
 * bootstrapping, which a backup file never is.
 */
function describesAnAccount(store: TDataStore): boolean {
  const debtAccounts = Object.values(store.account).filter(
    account => account.type === AccountType.Debt
  )
  return (
    debtAccounts.length === 1 &&
    Object.values(store.user).some(user => user.parent === null)
  )
}

function collectWarnings(
  backup: TFullBackupWire,
  store: TDataStore
): TFullBackupWarning[] {
  return [
    ...unknownFieldWarnings(backup),
    ...unwritableFieldWarnings(backup),
    ...unknownValueWarnings(backup),
    ...danglingReferenceWarnings(store),
  ]
}

/** Data a newer exporter wrote and this version has no meaning for. */
function unknownFieldWarnings(backup: TFullBackupWire): TFullBackupWarning[] {
  const warnings: TFullBackupWarning[] = []
  const knownTopLevelFields = new Set([
    'serverTimestamp',
    ...Object.keys(wireSchemas),
  ])
  Object.entries(backup).forEach(([field, value]) => {
    if (knownTopLevelFields.has(field)) return
    warnings.push({
      reason: 'unknownField',
      path: field,
      count: Array.isArray(value) ? Math.max(value.length, 1) : 1,
    })
  })

  Object.entries(wireSchemas).forEach(([collection, schema]) => {
    const knownFields = new Set(Object.keys(schema.shape))
    const counts = new Map<string, number>()
    rowsOf(backup, collection).forEach(row => {
      Object.keys(row).forEach(field => {
        if (knownFields.has(field)) return
        counts.set(field, (counts.get(field) ?? 0) + 1)
      })
    })
    counts.forEach((count, field) =>
      warnings.push({
        reason: 'unknownField',
        path: `${collection}.${field}`,
        count,
      })
    )
  })

  return warnings
}

/** Known fields a restore reads but the write API gives it no way to send. */
function unwritableFieldWarnings(
  backup: TFullBackupWire
): TFullBackupWarning[] {
  return unwritableWireFields.flatMap(path => {
    const [collection, field] = path.split('.')
    const count = rowsOf(backup, collection).filter(
      row => row[field] !== undefined && row[field] !== null
    ).length
    return count ? [{ reason: 'unwritableField' as const, path, count }] : []
  })
}

/** Values the protocol allows but this version has no behavior for. */
function unknownValueWarnings(backup: TFullBackupWire): TFullBackupWarning[] {
  const warnings: TFullBackupWarning[] = []

  Object.entries(knownWireValues).forEach(([path, known]) => {
    const [collection, field] = path.split('.')
    const knownValues = new Set<string>(known)
    const count = rowsOf(backup, collection).filter(row => {
      const value = row[field]
      return typeof value === 'string' && !knownValues.has(value)
    }).length
    if (count) warnings.push({ reason: 'unknownValue', path, count })
  })

  return warnings
}

/** Rows ZenMoney kept after their owner was deleted — see the entity graph. */
function danglingReferenceWarnings(store: TDataStore): TFullBackupWarning[] {
  const counts = new Map<string, number>()
  eachReferenceIssue(store, issue => {
    if (issue.reference.read !== 'tolerate') return
    const path = `${issue.reference.from}.${issue.reference.field}`
    counts.set(path, (counts.get(path) ?? 0) + 1)
  })
  return [...counts].map(([path, count]) => ({
    reason: 'danglingReference',
    path,
    count,
  }))
}

function rowsOf(backup: TFullBackupWire, collection: string): TWireRow[] {
  return (backup as Record<string, unknown>)[collection] as TWireRow[]
}

/**
 * Duplicates have to be caught on the wire: a normalized store is keyed by id,
 * so building it silently keeps the last row of a repeated identity.
 */
function hasUniqueRows(backup: TFullBackupWire): boolean {
  return Object.keys(wireSchemas).every(collection =>
    collection === 'budget'
      ? hasUniqueBudgetIdentities(backup)
      : hasUniqueIds(rowsOf(backup, collection))
  )
}

function hasUniqueIds(rows: TWireRow[]): boolean {
  return new Set(rows.map(row => row.id)).size === rows.length
}

function hasUniqueBudgetIdentities(backup: TFullBackupWire): boolean {
  const identities = backup.budget.map(row => `${row.date}#${row.tag}`)
  return new Set(identities).size === identities.length
}
