// The normalized ZenMoney data store and patch shapes. This is the core
// domain contract: `applyPatch(store, patch)` and command compilers speak in
// these types.
import { DataEntity } from '../patch'
import type { ById } from '../shared/types'
import type { TMsTime, TUnixTime } from './primitives'
import type { TInstrument } from './instruments/types'
import type { TCountry } from './countries/types'
import type { TCompany } from './companies/types'
import type { TUser, TUserId } from './users/types'
import type { TMerchant } from './merchants/types'
import type { TAccount } from './accounts/types'
import type { TTag } from './tags/types'
import type { TBudget } from './budgets/types'
import type { TReminder } from './reminders/types'
import type { TReminderMarker } from './reminderMarkers/types'
import type { TTransaction } from './transactions/types'

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

export type TZmDeletionObject = {
  id: string | number
  object: DataEntity
  stamp: TUnixTime
  user: TUserId
}

export type TDeletionObject = TZmDeletionObject & {
  stamp: TMsTime
}

export type TDeletionIntent = Pick<TDeletionObject, 'id' | 'object'>

/** Complete normalized entities applied to a snapshot after materialization. */
export type TDiff = {
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
