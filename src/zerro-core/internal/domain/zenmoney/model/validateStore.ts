import { AccountType } from '../entities/accounts'
import { globalBudgetTagId } from '../entities/budgets'
import { dataEntityKeys, type TDataStore } from './store'

export const dataStoreValidatorVersion = 1 as const

export type TDataStoreValidationResult =
  { ok: true } | { ok: false; reason: string }

/**
 * Checks the invariants needed before treating a reconstructed server state as
 * a restore source. The loader deliberately calls this once for the final
 * snapshot; canonical sync does not pay this cost on its hot path.
 *
 * Empty/partial fixtures are accepted while an account is being bootstrapped.
 * Once both users and accounts exist, the server graph must have one root user,
 * one debt account, valid references, and an acyclic tag-parent relation.
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

    const instrumentIds = store.instrument
    const countryIds = store.country
    const userIds = store.user
    const companyIds = store.company
    const accountIds = store.account
    const merchantIds = store.merchant
    const tagIds = store.tag
    const reminderIds = store.reminder
    const markerIds = store.reminderMarker

    users.forEach((user, index) => {
      requireReference(userIds, user.parent, `user[${index}].parent`, true)
      requireReference(instrumentIds, user.currency, `user[${index}].currency`)
      requireReference(countryIds, user.country, `user[${index}].country`)
    })

    Object.values(store.country).forEach((country, index) => {
      requireReference(
        instrumentIds,
        country.currency,
        `country[${index}].currency`
      )
    })

    Object.values(store.company).forEach((company, index) => {
      requireReference(
        countryIds,
        company.country,
        `company[${index}].country`,
        true
      )
    })

    accounts.forEach((account, index) => {
      requireReference(userIds, account.user, `account[${index}].user`)
      requireReference(
        instrumentIds,
        account.instrument,
        `account[${index}].instrument`
      )
      requireReference(
        companyIds,
        account.company,
        `account[${index}].company`,
        true
      )
    })

    Object.values(store.merchant).forEach((merchant, index) => {
      requireReference(userIds, merchant.user, `merchant[${index}].user`)
    })

    Object.values(store.tag).forEach((tag, index) => {
      requireReference(userIds, tag.user, `tag[${index}].user`)
      requireReference(tagIds, tag.parent, `tag[${index}].parent`, true)
    })
    validateTagCycles(store.tag)

    Object.values(store.budget).forEach((budget, index) => {
      requireReference(userIds, budget.user, `budget[${index}].user`)
      if (budget.tag !== null && budget.tag !== globalBudgetTagId) {
        requireReference(tagIds, budget.tag, `budget[${index}].tag`)
      }
    })

    Object.values(store.reminder).forEach((reminder, index) => {
      validateTransferReferences(
        reminder,
        {
          userIds,
          instrumentIds,
          accountIds,
          merchantIds,
          tagIds,
        },
        `reminder[${index}]`
      )
      if (reminder.points !== null) {
        if (
          !Array.isArray(reminder.points) ||
          reminder.points.some(point => !Number.isFinite(point))
        ) {
          fail(`reminder[${index}].points is invalid`)
        }
      }
    })

    Object.values(store.reminderMarker).forEach((marker, index) => {
      validateTransferReferences(
        marker,
        {
          userIds,
          instrumentIds,
          accountIds,
          merchantIds,
          tagIds,
        },
        `reminderMarker[${index}]`
      )
      requireReference(
        reminderIds,
        marker.reminder,
        `reminderMarker[${index}].reminder`
      )
      if (!['planned', 'processed', 'deleted'].includes(marker.state)) {
        fail(`reminderMarker[${index}].state is invalid`)
      }
    })

    Object.values(store.transaction).forEach((transaction, index) => {
      requireReference(userIds, transaction.user, `transaction[${index}].user`)
      // Deleting an account nulls the leg that pointed at it on a debt
      // operation, and soft-deletes the row rather than purging it — observed
      // in round 9. That row is canonical state the server keeps sending, so
      // rejecting it here would put a replica into recovery it cannot leave.
      // Only a soft-deleted row may carry the null: a live transaction with a
      // dangling leg is still corruption worth failing on.
      const legsMayBeNull = transaction.deleted === true
      requireReference(
        accountIds,
        transaction.incomeAccount,
        `transaction[${index}].incomeAccount`,
        legsMayBeNull
      )
      requireReference(
        accountIds,
        transaction.outcomeAccount,
        `transaction[${index}].outcomeAccount`,
        legsMayBeNull
      )
      requireReference(
        instrumentIds,
        transaction.incomeInstrument,
        `transaction[${index}].incomeInstrument`
      )
      requireReference(
        instrumentIds,
        transaction.outcomeInstrument,
        `transaction[${index}].outcomeInstrument`
      )
      requireTagReferences(transaction.tag, tagIds, `transaction[${index}].tag`)
      requireReference(
        merchantIds,
        transaction.merchant,
        `transaction[${index}].merchant`,
        true
      )
      requireReference(
        markerIds,
        transaction.reminderMarker,
        `transaction[${index}].reminderMarker`,
        true
      )
      requireReference(
        instrumentIds,
        transaction.opIncomeInstrument,
        `transaction[${index}].opIncomeInstrument`,
        true
      )
      requireReference(
        instrumentIds,
        transaction.opOutcomeInstrument,
        `transaction[${index}].opOutcomeInstrument`,
        true
      )
    })

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

function requireReference(
  map: TIdMap,
  id: unknown,
  path: string,
  nullable = false
): void {
  if (id === null && nullable) return
  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    !Object.prototype.hasOwnProperty.call(map, String(id))
  ) {
    fail(`${path} references a missing entity`)
  }
}

function requireTagReferences(
  tags: string[] | null,
  tagIds: TIdMap,
  path: string
): void {
  if (tags === null) return
  if (!Array.isArray(tags)) fail(`${path} is invalid`)
  tags.forEach((tag, index) =>
    requireReference(tagIds, tag, `${path}[${index}]`)
  )
}

function validateTransferReferences(
  transfer: {
    user: number
    incomeInstrument: number
    incomeAccount: string
    outcomeInstrument: number
    outcomeAccount: string
    tag: string[] | null
    merchant: string | null
  },
  maps: {
    userIds: TIdMap
    instrumentIds: TIdMap
    accountIds: TIdMap
    merchantIds: TIdMap
    tagIds: TIdMap
  },
  path: string
): void {
  requireReference(maps.userIds, transfer.user, `${path}.user`)
  requireReference(
    maps.instrumentIds,
    transfer.incomeInstrument,
    `${path}.incomeInstrument`
  )
  requireReference(
    maps.instrumentIds,
    transfer.outcomeInstrument,
    `${path}.outcomeInstrument`
  )
  requireReference(
    maps.accountIds,
    transfer.incomeAccount,
    `${path}.incomeAccount`
  )
  requireReference(
    maps.accountIds,
    transfer.outcomeAccount,
    `${path}.outcomeAccount`
  )
  requireTagReferences(transfer.tag, maps.tagIds, `${path}.tag`)
  requireReference(
    maps.merchantIds,
    transfer.merchant,
    `${path}.merchant`,
    true
  )
}

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
