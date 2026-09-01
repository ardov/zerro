import { AccountType } from '../entities/accounts'
import { eachReferenceIssue } from './entityGraph'
import { dataEntityKeys, type TDataStore } from './store'

export const dataStoreValidatorVersion = 2 as const

export type TDataStoreValidationResult =
  { ok: true } | { ok: false; reason: string }

/**
 * Checks the invariants needed before treating a reconstructed server state as
 * a restore source. The loader deliberately calls this once for the final
 * snapshot; canonical sync does not pay this cost on its hot path.
 *
 * Empty/partial fixtures are accepted while an account is being bootstrapped.
 * Once both users and accounts exist, the server graph must have one root user,
 * one debt account, the references Zerro must dereference, and an acyclic
 * tag-parent relation. References come from the entity graph, which also names
 * the two ZenMoney-retained orphans that are canonical data rather than
 * corruption.
 */
export function validateDataStore(
  store: TDataStore
): TDataStoreValidationResult {
  try {
    validateShape(store)

    const users = Object.values(store.user)
    const accounts = Object.values(store.account)
    if (!users.length || !accounts.length) return { ok: true }

    const roots = users.filter(user => user.parent === null)
    if (roots.length !== 1) {
      fail(`expected exactly one root user, found ${roots.length}`)
    }

    const debtAccounts = accounts.filter(
      account => account.type === AccountType.Debt
    )
    if (debtAccounts.length !== 1) {
      fail(`expected exactly one debt account, found ${debtAccounts.length}`)
    }

    eachReferenceIssue(store, issue => {
      if (issue.reference.read === 'tolerate') return
      fail(issue.message)
    })

    Object.values(store.reminder).forEach((reminder, index) => {
      if (reminder.points === null) return
      if (
        !Array.isArray(reminder.points) ||
        reminder.points.some(point => !Number.isFinite(point))
      ) {
        fail(`reminder[${index}].points is invalid`)
      }
    })

    validateTagCycles(store.tag)

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

function validateShape(store: TDataStore): void {
  if (!isRecord(store) || !Number.isFinite(store.serverTimestamp)) {
    fail('serverTimestamp is invalid')
  }
  dataEntityKeys.forEach(object => {
    const entities = store[object]
    if (!isRecord(entities)) fail(`${object} is invalid`)
    Object.entries(entities).forEach(([key, entity]) => {
      if (!isRecord(entity)) fail(`${object}.${key} is invalid`)
      if (
        (typeof entity.id !== 'string' && typeof entity.id !== 'number') ||
        (typeof entity.id === 'number' && !Number.isFinite(entity.id)) ||
        String(entity.id) !== key
      ) {
        fail(`${object}.${key}.id is invalid`)
      }
    })
  })
}

type TIdMap = Record<string, unknown>

function validateTagCycles(tags: TIdMap): void {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string): void => {
    if (visited.has(id)) return
    if (visiting.has(id)) fail(`tag parent cycle includes ${id}`)
    visiting.add(id)
    const parent = (tags[id] as { parent?: unknown } | undefined)?.parent
    if (typeof parent === 'string') visit(parent)
    visiting.delete(id)
    visited.add(id)
  }
  Object.keys(tags).forEach(visit)
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fail(message: string): never {
  throw new Error(message)
}
