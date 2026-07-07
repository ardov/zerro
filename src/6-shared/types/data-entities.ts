import type { TUnixTime, TMsTime } from './types'
import type {
  TFxCode,
  TInstrument,
  TInstrumentId,
  TZmInstrument,
} from 'core-next/zenmoney/instruments/types'
import type {
  TCompany,
  TCompanyId,
  TZmCompany,
} from 'core-next/zenmoney/companies/types'
import type {
  TCountry,
  TCountryId,
  TZmCountry,
} from 'core-next/zenmoney/countries/types'
import type { TUser, TUserId, TZmUser } from 'core-next/zenmoney/users/types'
import type {
  TMerchant,
  TMerchantId,
  TZmMerchant,
} from 'core-next/zenmoney/merchants/types'
import type {
  TAccount,
  TAccountId,
  TZmAccount,
} from 'core-next/zenmoney/accounts/types'
import type { TTag, TTagId, TZmTag } from 'core-next/zenmoney/tags/types'
import type {
  TBudget,
  TBudgetId,
  TZmBudget,
} from 'core-next/zenmoney/budgets/types'
import type {
  TReminder,
  TReminderId,
  TZmReminder,
} from 'core-next/zenmoney/reminders/types'
import type {
  TReminderMarker,
  TReminderMarkerId,
  TZmReminderMarker,
} from 'core-next/zenmoney/reminderMarkers/types'
import type {
  TTransaction,
  TTransactionId,
  TZmTransaction,
} from 'core-next/zenmoney/transactions/types'
import { DataEntity } from 'core-next/patch'

export type {
  TFxCode,
  TInstrument,
  TInstrumentId,
  TZmInstrument,
} from 'core-next/zenmoney/instruments/types'
export type {
  TCompany,
  TCompanyId,
  TZmCompany,
} from 'core-next/zenmoney/companies/types'
export type {
  TCountry,
  TCountryId,
  TZmCountry,
} from 'core-next/zenmoney/countries/types'
export type { TUser, TUserId, TZmUser } from 'core-next/zenmoney/users/types'
export type {
  TMerchant,
  TMerchantId,
  TZmMerchant,
} from 'core-next/zenmoney/merchants/types'
export type {
  TAccount,
  TAccountId,
  TZmAccount,
} from 'core-next/zenmoney/accounts/types'
export type { TTag, TTagId, TZmTag } from 'core-next/zenmoney/tags/types'
export type {
  TBudget,
  TBudgetId,
  TZmBudget,
} from 'core-next/zenmoney/budgets/types'
export { globalBudgetTagId } from 'core-next/zenmoney/budgets/types'
export type {
  TReminder,
  TReminderId,
  TZmReminder,
} from 'core-next/zenmoney/reminders/types'
export type {
  TReminderMarker,
  TReminderMarkerId,
  TZmReminderMarker,
} from 'core-next/zenmoney/reminderMarkers/types'
export type {
  TTransaction,
  TTransactionId,
  TZmTransaction,
} from 'core-next/zenmoney/transactions/types'
export { AccountType } from 'core-next/zenmoney/accounts/types'

// export type TToken = TAccessToken['access_token']

export { DataEntity } from 'core-next/patch'

// ---------------------------------------------------------------------
// DELETION
// ---------------------------------------------------------------------

export type TZmDeletionObject = {
  id: string | number
  object: DataEntity
  stamp: TUnixTime
  user: TUserId
}

export type TDeletionObject = TZmDeletionObject & {
  stamp: TMsTime
}

// ---------------------------------------------------------------------
// DIFF
// ---------------------------------------------------------------------

export type TZmDiff = {
  serverTimestamp: TUnixTime
  deletion?: TZmDeletionObject[]
  instrument?: TZmInstrument[]
  country?: TZmCountry[]
  company?: TZmCompany[]
  user?: TZmUser[]
  merchant?: TZmMerchant[]
  account?: TZmAccount[]
  tag?: TZmTag[]
  budget?: TZmBudget[]
  reminder?: TZmReminder[]
  reminderMarker?: TZmReminderMarker[]
  transaction?: TZmTransaction[]
}

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

export type TZmRequest = TZmDiff & {
  currentClientTimestamp: TUnixTime
  forceFetch?: DataEntity[]
}
