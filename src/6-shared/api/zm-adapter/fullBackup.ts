/**
 * Decode the complete file produced by Zerro's JSON exporter.
 *
 * This is a protocol adapter: it validates untrusted wire JSON, converts it
 * through the shared ZenMoney codec, then returns a normalized Core snapshot.
 */
import { z } from 'zod'
import { applyPatch, createEmptyDataStore } from 'zerro-core/headless'
import type { TDataStore, TZmDiff } from '6-shared/types'

import { convertDiff } from './converters'
import {
  accountWireSchema,
  budgetWireSchema,
  companyWireSchema,
  countryWireSchema,
  instrumentWireSchema,
  merchantWireSchema,
  reminderMarkerWireSchema,
  reminderWireSchema,
  tagWireSchema,
  transactionWireSchema,
  userWireSchema,
} from './schemas'

const fullBackupWireSchema = z
  .object({
    serverTimestamp: z.number().finite().nonnegative(),
    instrument: z.array(instrumentWireSchema),
    country: z.array(countryWireSchema),
    company: z.array(companyWireSchema),
    user: z.array(userWireSchema),
    merchant: z.array(merchantWireSchema),
    account: z.array(accountWireSchema),
    tag: z.array(tagWireSchema),
    budget: z.array(budgetWireSchema),
    reminder: z.array(reminderWireSchema),
    reminderMarker: z.array(reminderMarkerWireSchema),
    transaction: z.array(transactionWireSchema),
  })
  .strict()

type TFullBackupWire = z.output<typeof fullBackupWireSchema>

export type TFullBackupParseResult =
  | { ok: true; store: TDataStore }
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
  if (
    !parsed.success ||
    !hasUniqueRows(parsed.data) ||
    !hasValidReferences(parsed.data)
  ) {
    return { ok: false, reason: 'notABackup' }
  }

  return {
    ok: true,
    store: applyPatch(
      createEmptyDataStore(),
      convertDiff.toClient(parsed.data as TZmDiff)
    ),
  }
}

function hasUniqueRows(backup: TFullBackupWire): boolean {
  return (
    hasUniqueIds(backup.instrument) &&
    hasUniqueIds(backup.country) &&
    hasUniqueIds(backup.company) &&
    hasUniqueIds(backup.user) &&
    hasUniqueIds(backup.merchant) &&
    hasUniqueIds(backup.account) &&
    hasExactlyOneDebtAccount(backup.account) &&
    hasUniqueIds(backup.tag) &&
    hasUniqueBudgetIdentities(backup) &&
    hasUniqueIds(backup.reminder) &&
    hasUniqueIds(backup.reminderMarker) &&
    hasUniqueIds(backup.transaction)
  )
}

function hasExactlyOneDebtAccount(rows: TFullBackupWire['account']): boolean {
  return rows.filter(row => row.type === 'debt').length === 1
}

function hasUniqueIds<TRow extends { id: string | number }>(
  rows: TRow[]
): boolean {
  return new Set(rows.map(row => row.id)).size === rows.length
}

function hasUniqueBudgetIdentities(backup: TFullBackupWire): boolean {
  const identities = backup.budget.map(row => `${row.date}#${row.tag}`)
  return new Set(identities).size === identities.length
}

function hasValidReferences(backup: TFullBackupWire): boolean {
  const ids = {
    instrument: new Set(backup.instrument.map(row => row.id)),
    country: new Set(backup.country.map(row => row.id)),
    company: new Set(backup.company.map(row => row.id)),
    user: new Set(backup.user.map(row => row.id)),
    merchant: new Set(backup.merchant.map(row => row.id)),
    account: new Set(backup.account.map(row => row.id)),
    tag: new Set(backup.tag.map(row => row.id)),
    reminder: new Set(backup.reminder.map(row => row.id)),
    reminderMarker: new Set(backup.reminderMarker.map(row => row.id)),
  }
  const owns = <TRow extends { user: number }>(rows: TRow[]) =>
    rows.every(row => ids.user.has(row.user))
  const tagReferences = (tags: string[] | null) =>
    tags === null || tags.every(tag => ids.tag.has(tag))
  const merchantReference = (merchant: string | null) =>
    merchant === null || ids.merchant.has(merchant)
  const accountReferences = (row: {
    incomeInstrument: number
    outcomeInstrument: number
    incomeAccount: string
    outcomeAccount: string
  }) =>
    ids.instrument.has(row.incomeInstrument) &&
    ids.instrument.has(row.outcomeInstrument) &&
    ids.account.has(row.incomeAccount) &&
    ids.account.has(row.outcomeAccount)

  return (
    backup.user.filter(row => row.parent === null).length === 1 &&
    backup.user.every(row => row.parent === null || ids.user.has(row.parent)) &&
    backup.user.every(
      row => ids.instrument.has(row.currency) && ids.country.has(row.country)
    ) &&
    backup.country.every(row => ids.instrument.has(row.currency)) &&
    backup.company.every(
      row => row.country === null || ids.country.has(row.country)
    ) &&
    owns(backup.merchant) &&
    backup.account.every(
      row =>
        ids.user.has(row.user) &&
        ids.instrument.has(row.instrument) &&
        (row.company === null || ids.company.has(row.company))
    ) &&
    owns(backup.tag) &&
    hasAcyclicTagGraph(backup.tag) &&
    backup.budget.every(
      row =>
        ids.user.has(row.user) && (row.tag === null || ids.tag.has(row.tag))
    ) &&
    owns(backup.reminder) &&
    backup.reminder.every(
      row =>
        accountReferences(row) &&
        tagReferences(row.tag) &&
        merchantReference(row.merchant)
    ) &&
    owns(backup.reminderMarker) &&
    backup.reminderMarker.every(
      row =>
        accountReferences(row) &&
        tagReferences(row.tag) &&
        merchantReference(row.merchant) &&
        ids.reminder.has(row.reminder)
    ) &&
    owns(backup.transaction) &&
    backup.transaction.every(
      row =>
        accountReferences(row) &&
        tagReferences(row.tag) &&
        merchantReference(row.merchant) &&
        (row.reminderMarker === null ||
          ids.reminderMarker.has(row.reminderMarker))
    )
  )
}

function hasAcyclicTagGraph(rows: TFullBackupWire['tag']): boolean {
  const parentById = new Map(rows.map(row => [row.id, row.parent]))
  return rows.every(row => {
    const visited = new Set<string>()
    let id: string | null | undefined = row.id
    while (id !== null) {
      if (id === undefined || visited.has(id)) return false
      visited.add(id)
      id = parentById.get(id)
    }
    return true
  })
}
