/** Validate wire JSON here; normalized references and invariants belong to the Core store validator. */
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
    // Keep unknown keys for forward compatibility. The snapshot discriminator must still identify a complete backup.
    deletion: z.never().optional(),
    ...fullBackupCollectionsShape,
  })
  .passthrough()

type TFullBackupWire = z.output<typeof fullBackupWireSchema>
type TWireRow = Record<string, unknown>

export type TFullBackupWarning = {
  reason: 'unknownField' | 'unknownValue' | 'danglingReference'
  path: string
  count: number
}

export type TFullBackupParseResult =
  | { ok: true; store: TDataStore; warnings: TFullBackupWarning[] }
  | { ok: false; reason: 'unreadable' | 'notABackup' }

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

/** Backups require a live account; the store validator also permits a bootstrapping replica. */
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
    ...unknownValueWarnings(backup),
    ...danglingReferenceWarnings(store),
  ]
}

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

/** Reject duplicate IDs before normalization silently keeps only the last row. */
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
