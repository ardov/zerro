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
  TDataEntityKey,
} from 'zerro-core/domain/zenmoney'

export type {
  TFxCode,
  TInstrument,
  TInstrumentId,
  TZmInstrument,
} from 'zerro-core/domain/zenmoney'
export type {
  TCompany,
  TCompanyId,
  TZmCompany,
} from 'zerro-core/domain/zenmoney'
export type {
  TCountry,
  TCountryId,
  TZmCountry,
} from 'zerro-core/domain/zenmoney'
export type {
  TUser,
  TUserId,
  TZmUser,
} from 'zerro-core/domain/zenmoney/users/types'
export type {
  TMerchant,
  TMerchantId,
  TZmMerchant,
} from 'zerro-core/domain/zenmoney'
export type {
  TAccount,
  TAccountId,
  TZmAccount,
} from 'zerro-core/domain/zenmoney'
export type { TTag, TTagId, TZmTag } from 'zerro-core/domain/zenmoney'
export type { TBudget, TBudgetId, TZmBudget } from 'zerro-core/domain/zenmoney'
export { globalBudgetTagId } from 'zerro-core/domain/zenmoney'
export type {
  TReminder,
  TReminderId,
  TZmReminder,
} from 'zerro-core/domain/zenmoney'
export type {
  TReminderMarker,
  TReminderMarkerId,
  TZmReminderMarker,
} from 'zerro-core/domain/zenmoney'
export type {
  TTransaction,
  TTransactionId,
  TZmTransaction,
} from 'zerro-core/domain/zenmoney'
export { AccountType } from 'zerro-core/domain/zenmoney'

// export type TToken = TAccessToken['access_token']

// ---------------------------------------------------------------------
// DELETION — owned by Zerro Core
// ---------------------------------------------------------------------

export type {
  TZmDeletionObject,
  TDeletionObject,
} from 'zerro-core/domain/zenmoney'
import type { TZmDeletionObject } from 'zerro-core/domain/zenmoney'

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

// The normalized diff/patch shape is owned by Zerro Core.
export type { TDiff } from 'zerro-core/domain/zenmoney'

export type TZmRequest = TZmDiff & {
  currentClientTimestamp: TUnixTime
  forceFetch?: TDataEntityKey[]
}
