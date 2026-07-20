// The normalized ZenMoney data store and patch shapes. This is the core
// domain contract: `applyPatch(store, patch)` and command compilers speak in
// these types.
import type { ById } from '../shared/types'
import type { TMsTime, TUnixTime } from './primitives'
import type { TInstrument } from './instruments'
import type { TCountry } from './countries'
import type { TCompany } from './companies'
import type { TUser, TUserId } from './users'
import type { TMerchant, TMerchantPatch } from './merchants'
import type { TAccount, TAccountPatch } from './accounts'
import type { TTag, TTagPatch } from './tags'
import type { TBudget, TBudgetPatch } from './budgets'
import type { TReminder, TReminderPatch } from './reminders'
import type { TReminderMarker } from './reminderMarkers'
import type { TTransaction, TTransactionPatch } from './transactions/types'

// prettier-ignore
export type TDataStore = {
  serverTimestamp:  TMsTime
  instrument:       ById<TInstrument>
  country:          ById<TCountry>
  company:          ById<TCompany>
  user:             ById<TUser>
  merchant:         ById<TMerchant>
  account:          ById<TAccount>
  tag:              ById<TTag>
  budget:           ById<TBudget>
  reminder:         ById<TReminder>
  reminderMarker:   ById<TReminderMarker>
  transaction:      ById<TTransaction>
}

export const dataEntityKeys = [
  'instrument',
  'country',
  'company',
  'user',
  'merchant',
  'account',
  'tag',
  'budget',
  'reminder',
  'reminderMarker',
  'transaction',
] as const satisfies readonly Exclude<keyof TDataStore, 'serverTimestamp'>[]

export type TDataEntityKey = (typeof dataEntityKeys)[number]

export type TDeletionObject = {
  id: string | number
  object: TDataEntityKey
  stamp: TMsTime
  user: TUserId
}

export type TZmDeletionObject = TDeletionObject & {
  stamp: TUnixTime
}

export type TDeletionIntent = Pick<TDeletionObject, 'id' | 'object'>

/**
 * Sparse user intent: entity patches carrying only the changed writable
 * fields plus deletion intents. This is the persisted command payload shape
 * and the shape domain command compilers return.
 */
export type TIntentPatch = {
  deletion?: TDeletionIntent[]
  account?: TAccountPatch[]
  merchant?: TMerchantPatch[]
  tag?: TTagPatch[]
  budget?: TBudgetPatch[]
  reminder?: TReminderPatch[]
  transaction?: TTransactionPatch[]
}

export const intentEntityKeys = [
  'account',
  'merchant',
  'tag',
  'budget',
  'reminder',
  'transaction',
] as const satisfies readonly Exclude<keyof TIntentPatch, 'deletion'>[]

export const intentPatchKeys = [
  'deletion',
  ...intentEntityKeys,
] as const satisfies readonly (keyof TIntentPatch)[]

type TIntentEntityKey = (typeof intentEntityKeys)[number]

/**
 * Sparse patch intent for entities whose only compile rule is "it must already
 * exist". Entity modules wrap this with their own types and any extra guard.
 */
export function compileEntityPatch<TKey extends TIntentEntityKey>(
  data: TDataStore,
  key: TKey,
  patch:
    NonNullable<TIntentPatch[TKey]> | NonNullable<TIntentPatch[TKey]>[number]
): TIntentPatch {
  const list = Array.isArray(patch) ? patch : [patch]
  const byId = data[key] as Record<string | number, unknown>

  list.forEach(item => {
    if (!item.id) throw new Error(`Trying to patch ${key} without id`)
    if (!byId[item.id]) throw new Error(`${capitalize(key)} not found`)
  })

  return { [key]: list }
}

function capitalize(value: string): string {
  return value[0].toUpperCase() + value.slice(1)
}

/** Complete normalized entities applied to a snapshot after materialization. */
export type TNormalizedPatch = {
  serverTimestamp?: TMsTime
  deletion?: TDeletionObject[]
  instrument?: TInstrument[]
  country?: TCountry[]
  company?: TCompany[]
  user?: TUser[]
  account?: TAccount[]
  merchant?: TMerchant[]
  tag?: TTag[]
  budget?: TBudget[]
  reminder?: TReminder[]
  reminderMarker?: TReminderMarker[]
  transaction?: TTransaction[]
}
