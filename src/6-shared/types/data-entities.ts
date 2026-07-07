import type { TUnixTime, TMsTime } from './types'
import type {
  TInstrument,
  TZmInstrument,
  TCompany,
  TZmCompany,
  TCountry,
  TZmCountry,
  TUser,
  TUserId,
  TZmUser,
  TMerchant,
  TZmMerchant,
  TAccount,
  TZmAccount,
  TTag,
  TZmTag,
  TBudget,
  TZmBudget,
  TReminder,
  TZmReminder,
  TReminderMarker,
  TZmReminderMarker,
  TTransaction,
  TZmTransaction,
} from 'core-next/zenmoney'

import { DataEntity } from 'core-next/patch'

export type {
  TFxCode,
  TInstrument,
  TInstrumentId,
  TZmInstrument,
} from 'core-next/zenmoney'
export type { TCompany, TCompanyId, TZmCompany } from 'core-next/zenmoney'
export type { TCountry, TCountryId, TZmCountry } from 'core-next/zenmoney'
export type { TUser, TUserId, TZmUser } from 'core-next/zenmoney/users/types'
export type { TMerchant, TMerchantId, TZmMerchant } from 'core-next/zenmoney'
export type { TAccount, TAccountId, TZmAccount } from 'core-next/zenmoney'
export type { TTag, TTagId, TZmTag } from 'core-next/zenmoney'
export type { TBudget, TBudgetId, TZmBudget } from 'core-next/zenmoney'
export { globalBudgetTagId } from 'core-next/zenmoney'
export type { TReminder, TReminderId, TZmReminder } from 'core-next/zenmoney'
export type {
  TReminderMarker,
  TReminderMarkerId,
  TZmReminderMarker,
} from 'core-next/zenmoney'
export type {
  TTransaction,
  TTransactionId,
  TZmTransaction,
} from 'core-next/zenmoney'
export { AccountType } from 'core-next/zenmoney'

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
