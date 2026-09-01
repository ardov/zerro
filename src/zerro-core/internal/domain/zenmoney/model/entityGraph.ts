/**
 * The reference graph between ZenMoney entities: who points at whom, whether
 * the pointer may be empty, and what a reader and a writer each do when it
 * dangles.
 *
 * One declaration, four consumers. Validation reads it as "what to check",
 * backup import as "what to warn about", restore and push as "what a write
 * may not contain", and the write order is derived from it — so an entity
 * added to the graph cannot be remembered in one of those places and
 * forgotten in another.
 */
import { globalBudgetTagId } from '../entities/budgets'
import {
  dataEntityKeys,
  intentEntityKeys,
  type TDataEntityKey,
  type TDataStore,
  type TIntentEntityKey,
} from './store'

type TRowLike = { [field: string]: unknown }

/** Whether a dangling pointer makes the snapshot corrupt. */
export type TReferenceRead = 'reject' | 'tolerate'

/** What a write path does when the target row will not exist. */
export type TReferenceWrite = 'reject' | 'prune' | 'clear'

export type TEntityReference = {
  from: TDataEntityKey
  field: string
  to: TDataEntityKey
  /** The field holds an array of ids; `null` stands for "none". */
  many?: boolean
  /** `null` is a legitimate value rather than a dangling pointer. */
  nullable?: boolean
  /** Rows on which a normally required reference may still be null. */
  nullableWhen?: (row: TRowLike) => boolean
  /** Reserved values that are not references at all. */
  exempt?: readonly (string | number)[]
  /** Defaults to `reject`: a dangling reference is corruption. */
  read?: TReferenceRead
  /** Defaults to `reject`: the writer is not allowed to invent a fix. */
  write?: TReferenceWrite
}

/**
 * `read: 'tolerate'` marks the two places where ZenMoney keeps a row after its
 * owner is gone. Those rows are canonical to read and impossible to write, so
 * every write path prunes them and the import seam reports them.
 */
export const entityReferences: readonly TEntityReference[] = [
  { from: 'country', field: 'currency', to: 'instrument' },

  { from: 'company', field: 'country', to: 'country', nullable: true },

  { from: 'user', field: 'parent', to: 'user', nullable: true },
  { from: 'user', field: 'currency', to: 'instrument' },
  { from: 'user', field: 'country', to: 'country' },

  { from: 'merchant', field: 'user', to: 'user' },

  { from: 'account', field: 'user', to: 'user' },
  { from: 'account', field: 'instrument', to: 'instrument' },
  { from: 'account', field: 'company', to: 'company', nullable: true },

  { from: 'tag', field: 'user', to: 'user' },
  { from: 'tag', field: 'parent', to: 'tag', nullable: true },

  { from: 'budget', field: 'user', to: 'user' },
  {
    from: 'budget',
    field: 'tag',
    to: 'tag',
    nullable: true,
    exempt: [globalBudgetTagId],
    read: 'tolerate',
    write: 'prune',
  },

  { from: 'reminder', field: 'user', to: 'user' },
  { from: 'reminder', field: 'incomeInstrument', to: 'instrument' },
  { from: 'reminder', field: 'outcomeInstrument', to: 'instrument' },
  { from: 'reminder', field: 'incomeAccount', to: 'account' },
  { from: 'reminder', field: 'outcomeAccount', to: 'account' },
  { from: 'reminder', field: 'tag', to: 'tag', many: true, nullable: true },
  { from: 'reminder', field: 'merchant', to: 'merchant', nullable: true },

  { from: 'reminderMarker', field: 'user', to: 'user' },
  { from: 'reminderMarker', field: 'incomeInstrument', to: 'instrument' },
  { from: 'reminderMarker', field: 'outcomeInstrument', to: 'instrument' },
  { from: 'reminderMarker', field: 'incomeAccount', to: 'account' },
  { from: 'reminderMarker', field: 'outcomeAccount', to: 'account' },
  {
    from: 'reminderMarker',
    field: 'tag',
    to: 'tag',
    many: true,
    nullable: true,
  },
  { from: 'reminderMarker', field: 'merchant', to: 'merchant', nullable: true },
  {
    from: 'reminderMarker',
    field: 'reminder',
    to: 'reminder',
    read: 'tolerate',
    write: 'prune',
  },

  { from: 'transaction', field: 'user', to: 'user' },
  { from: 'transaction', field: 'incomeInstrument', to: 'instrument' },
  { from: 'transaction', field: 'outcomeInstrument', to: 'instrument' },
  // Deleting an account nulls the leg that pointed at it on a debt operation
  // and soft-deletes the row instead of purging it. A live row with a missing
  // leg is still corruption.
  {
    from: 'transaction',
    field: 'incomeAccount',
    to: 'account',
    nullableWhen: row => row.deleted === true,
  },
  {
    from: 'transaction',
    field: 'outcomeAccount',
    to: 'account',
    nullableWhen: row => row.deleted === true,
  },
  { from: 'transaction', field: 'tag', to: 'tag', many: true, nullable: true },
  { from: 'transaction', field: 'merchant', to: 'merchant', nullable: true },
  {
    from: 'transaction',
    field: 'reminderMarker',
    to: 'reminderMarker',
    nullable: true,
    write: 'clear',
  },
  {
    from: 'transaction',
    field: 'opIncomeInstrument',
    to: 'instrument',
    nullable: true,
  },
  {
    from: 'transaction',
    field: 'opOutcomeInstrument',
    to: 'instrument',
    nullable: true,
  },
]

const referencesByEntity = new Map<TDataEntityKey, TEntityReference[]>(
  dataEntityKeys.map(key => [
    key,
    entityReferences.filter(reference => reference.from === key),
  ])
)

export function referencesFrom(
  key: TDataEntityKey
): readonly TEntityReference[] {
  return referencesByEntity.get(key) ?? []
}

/**
 * Rows a snapshot contains but a write world never does. A restore does not
 * recreate a deleted marker, so nothing written may point at one either.
 */
const absentRowPredicates: Partial<
  Record<TDataEntityKey, (row: TRowLike) => boolean>
> = {
  reminderMarker: row => row.state === 'deleted',
}

export function isAbsentRow(key: TDataEntityKey, row: TRowLike): boolean {
  return absentRowPredicates[key]?.(row) ?? false
}

/**
 * Write order: an entity lands only after everything it points at. Derived
 * from the graph, with the declaration order of `dataEntityKeys` as the
 * tie-break between entities the graph leaves independent.
 */
export const entityWriteOrder = topologicalOrder()

/** The same order, restricted to the entities a client may write. */
export const entityUpsertOrder = entityWriteOrder.filter(
  (key): key is TIntentEntityKey =>
    (intentEntityKeys as readonly string[]).includes(key)
)

/**
 * Deletion order, and deliberately not the reverse of the write order.
 * An account deletion cascades server-side, so it runs first and prunes what
 * would otherwise need deleting one row at a time. Tags run last because
 * every other entity may still point at one while it is being removed.
 */
export const entityCleanupOrder = [
  'account',
  'transaction',
  'reminderMarker',
  'reminder',
  'budget',
  'merchant',
  'user',
  'company',
  'country',
  'instrument',
  'tag',
] as const satisfies readonly TDataEntityKey[]

/** Reporting order: writable entities first, then read-only reference data. */
export const entityProgressOrder = [
  ...entityUpsertOrder,
  ...dataEntityKeys.filter(
    key => !(entityUpsertOrder as readonly string[]).includes(key)
  ),
]

function topologicalOrder(): TDataEntityKey[] {
  const pending = new Set<TDataEntityKey>(dataEntityKeys)
  const placed = new Set<TDataEntityKey>()
  const order: TDataEntityKey[] = []

  while (pending.size) {
    // Self-references are ordered inside a chunk, not between entities.
    const ready = [...pending].filter(key =>
      referencesFrom(key).every(
        reference => reference.to === key || placed.has(reference.to)
      )
    )
    if (!ready.length) {
      throw new Error('Entity reference graph has a cycle between entities')
    }
    ready.forEach(key => {
      order.push(key)
      placed.add(key)
      pending.delete(key)
    })
  }
  return order
}

export type TReferenceIssue = {
  reference: TEntityReference
  /** `budget[3].tag` — the shape validation failures are reported in. */
  path: string
  message: string
}

/**
 * Walks every declared reference of a snapshot and reports the ones that do
 * not resolve. Row order follows `Object.values`, which is the order the
 * store was built in.
 */
export function eachReferenceIssue(
  store: TDataStore,
  visit: (issue: TReferenceIssue) => void
): void {
  dataEntityKeys.forEach(key => {
    const references = referencesFrom(key)
    if (!references.length) return
    Object.values(store[key]).forEach((row, index) => {
      references.forEach(reference => {
        const path = `${key}[${index}].${reference.field}`
        checkReference(store, reference, row as TRowLike, path, visit)
      })
    })
  })
}

function checkReference(
  store: TDataStore,
  reference: TEntityReference,
  row: TRowLike,
  path: string,
  visit: (issue: TReferenceIssue) => void
): void {
  const value = row[reference.field]
  const present = (id: unknown) => hasRow(store, reference.to, id)

  if (reference.many) {
    if (value === null || value === undefined) return
    if (!Array.isArray(value)) {
      visit({ reference, path, message: `${path} is invalid` })
      return
    }
    value.forEach((item, index) => {
      if (!present(item)) {
        visit({
          reference,
          path: `${path}[${index}]`,
          message: `${path}[${index}] references a missing entity`,
        })
      }
    })
    return
  }

  if (isEmptyReference(reference, value, row)) return
  if (!present(value)) {
    visit({
      reference,
      path,
      message: `${path} references a missing entity`,
    })
  }
}

/** Whether a single-valued reference legitimately points at nothing. */
function isEmptyReference(
  reference: TEntityReference,
  value: unknown,
  row: TRowLike
): boolean {
  if (reference.exempt?.some(reserved => reserved === value)) return true
  if (value !== null) return false
  return reference.nullable === true || reference.nullableWhen?.(row) === true
}

function hasRow(
  store: TDataStore,
  key: TDataEntityKey,
  id: unknown
): boolean {
  if (typeof id !== 'string' && typeof id !== 'number') return false
  return Object.prototype.hasOwnProperty.call(store[key], String(id))
}

/** Whether a row exists in the world a write is about to produce. */
export type TRowPresence = (key: TDataEntityKey, id: unknown) => boolean

/**
 * Whether a write may contain this row at all. Only `write: 'prune'` decides
 * that: those are the references ZenMoney leaves dangling in a snapshot and
 * refuses to recreate, so the row has to go. A dangling `reject` reference is
 * corruption the reader already refused, not something to drop silently here.
 */
export function isRowWritable(
  key: TDataEntityKey,
  row: TRowLike,
  present: TRowPresence
): boolean {
  return referencesFrom(key).every(reference => {
    if (reference.write !== 'prune') return true
    if (reference.many) return true
    if (isEmptyReference(reference, row[reference.field], row)) return true
    return present(reference.to, row[reference.field])
  })
}

/**
 * Nulls the references whose target the write world will not contain. Returns
 * the original row when nothing has to change.
 */
export function clearAbsentReferences<TRow extends TRowLike>(
  key: TDataEntityKey,
  row: TRow,
  present: TRowPresence
): TRow {
  let result = row
  referencesFrom(key).forEach(reference => {
    if (reference.write !== 'clear') return
    const value = result[reference.field]
    if (value === null || value === undefined) return
    if (present(reference.to, value)) return
    result = { ...result, [reference.field]: null }
  })
  return result
}

/**
 * Drops the rows a write cannot contain and clears the references that would
 * point at them. Entities are visited in write order, so a pruned owner is
 * already gone when its dependants are considered.
 */
export function pruneUnwritableRows(store: TDataStore): TDataStore {
  const result = { ...store }
  const present: TRowPresence = (key, id) => {
    if (typeof id !== 'string' && typeof id !== 'number') return false
    const row = (result[key] as Record<string, TRowLike | undefined>)[
      String(id)
    ]
    return row !== undefined && !isAbsentRow(key, row)
  }

  entityWriteOrder.forEach(key => {
    const rows = result[key] as Record<string, TRowLike>
    let changed = false
    const kept: Record<string, TRowLike> = {}
    Object.entries(rows).forEach(([id, row]) => {
      if (!isRowWritable(key, row, present)) {
        changed = true
        return
      }
      const cleared = clearAbsentReferences(key, row, present)
      if (cleared !== row) changed = true
      kept[id] = cleared
    })
    if (changed) (result as Record<string, unknown>)[key] = kept
  })

  return result
}
