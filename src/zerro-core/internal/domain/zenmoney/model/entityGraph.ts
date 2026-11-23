/** Reference declarations drive validation, backup warnings, write pruning, and dependency order. */
import { globalBudgetTagId } from '../entities/budgets'
import {
  dataEntityKeys,
  intentEntityKeys,
  type TDataEntityKey,
  type TDataStore,
  type TIntentEntityKey,
} from './store'

type TRowLike = { [field: string]: unknown }

export type TReferenceRead = 'reject' | 'tolerate'

export type TReferenceWrite = 'reject' | 'prune' | 'clear'

export type TEntityReference = {
  from: TDataEntityKey
  field: string
  to: TDataEntityKey
  many?: boolean
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

/** Read tolerance keeps canonical rows; write pruning is a separate policy that affects restore and push. */
export const entityReferences: readonly TEntityReference[] = [
  { from: 'country', field: 'currency', to: 'instrument' },

  { from: 'company', field: 'country', to: 'country', nullable: true },

  { from: 'user', field: 'parent', to: 'user', nullable: true },
  { from: 'user', field: 'currency', to: 'instrument' },
  { from: 'user', field: 'country', to: 'country', nullable: true },

  // Ownership metadata is not needed to display or reference a merchant.
  // Keep the server row intact even when its owner is missing or unavailable.
  { from: 'merchant', field: 'user', to: 'user', read: 'tolerate' },

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
  // Account deletion nulls a debt leg and soft-deletes the row. A live row with a missing leg is corrupt.
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

/** Never write a reference to a deleted marker: restore cannot recreate it. */
const absentRowPredicates: Partial<
  Record<TDataEntityKey, (row: TRowLike) => boolean>
> = {
  reminderMarker: row => row.state === 'deleted',
}

export function isAbsentRow(key: TDataEntityKey, row: TRowLike): boolean {
  return absentRowPredicates[key]?.(row) ?? false
}

/** Write dependencies first; break ties between independent collections using dataEntityKeys order. */
export const entityWriteOrder = topologicalOrder()

export const entityUpsertOrder = entityWriteOrder.filter(
  (key): key is TIntentEntityKey =>
    (intentEntityKeys as readonly string[]).includes(key)
)

/** Delete accounts first to use the server cascade, and tags last because other entities can still reference them. */
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
  path: string
  message: string
}

export function eachReferenceIssue(
  store: TDataStore,
  visit: (issue: TReferenceIssue) => void
): void {
  dataEntityKeys.forEach(key => {
    const references = referencesFrom(key)
    if (!references.length) return
    Object.values(store[key]).forEach((row, index) => {
      references.forEach(reference => {
        checkReference(store, reference, row as TRowLike, key, index, visit)
      })
    })
  })
}

function checkReference(
  store: TDataStore,
  reference: TEntityReference,
  row: TRowLike,
  key: TDataEntityKey,
  rowIndex: number,
  visit: (issue: TReferenceIssue) => void
): void {
  const value = row[reference.field]
  const present = (id: unknown) => hasRow(store, reference.to, id)
  // Built only for an issue: most references resolve.
  const pathOf = (suffix = '') =>
    `${key}[${rowIndex}].${reference.field}${suffix}`

  if (reference.many) {
    if (value === null || value === undefined) return
    if (!Array.isArray(value)) {
      const path = pathOf()
      visit({ reference, path, message: `${path} is invalid` })
      return
    }
    value.forEach((item, index) => {
      if (!present(item)) {
        const path = pathOf(`[${index}]`)
        visit({
          reference,
          path,
          message: `${path} references a missing entity`,
        })
      }
    })
    return
  }

  if (isEmptyReference(reference, value, row)) return
  if (!present(value)) {
    const path = pathOf()
    visit({
      reference,
      path,
      message: `${path} references a missing entity`,
    })
  }
}

function isEmptyReference(
  reference: TEntityReference,
  value: unknown,
  row: TRowLike
): boolean {
  if (reference.exempt?.some(reserved => reserved === value)) return true
  if (value !== null) return false
  return reference.nullable === true || reference.nullableWhen?.(row) === true
}

function hasRow(store: TDataStore, key: TDataEntityKey, id: unknown): boolean {
  if (typeof id !== 'string' && typeof id !== 'number') return false
  return Object.hasOwn(store[key], id)
}

export type TRowPresence = (key: TDataEntityKey, id: unknown) => boolean

/** Only write: 'prune' may remove a row; other policies must not silently drop it. */
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

/** Prune in write order so a removed owner is already absent when its dependants are checked. */
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
