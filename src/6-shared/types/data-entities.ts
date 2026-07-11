import type { TUnixTime } from './types'
import type {
  TZmInstrument,
  TZmCompany,
  TZmCountry,
  TZmUser,
  TZmMerchant,
  TZmAccount,
  TZmTag,
  TZmBudget,
  TZmReminder,
  TZmReminderMarker,
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
// DELETION — owned by Core Next
// ---------------------------------------------------------------------

export type { TZmDeletionObject, TDeletionObject } from 'core-next/zenmoney'
import type { TZmDeletionObject } from 'core-next/zenmoney'

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

// The normalized diff/patch shape is owned by Core Next.
export type { TDiff } from 'core-next/zenmoney'

export type TZmRequest = TZmDiff & {
  currentClientTimestamp: TUnixTime
  forceFetch?: DataEntity[]
}
