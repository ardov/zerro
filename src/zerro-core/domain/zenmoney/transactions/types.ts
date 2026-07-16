import type { TAccountId } from '../accounts'
import type { TCompanyId } from '../companies'
import type { TInstrumentId } from '../instruments'
import type { TMerchantId } from '../merchants'
import type { TMsTime, TISODate, TUnixTime, TUnits } from '../primitives'
import type { TReminderMarkerId } from '../reminderMarkers'
import type { TTagId } from '../tags'
import type { TUserId } from '../users'

export type TTransactionId = string

export type TZmTransaction = {
  id: TTransactionId
  changed: TUnixTime
  created: TUnixTime
  user: TUserId
  deleted: boolean
  hold: boolean | null
  viewed?: boolean
  /** Added as `null` by observed responses; non-null shape is not established. */
  source?: unknown
  qrCode: string | null
  incomeBankID: TCompanyId | null
  incomeInstrument: TInstrumentId
  incomeAccount: TAccountId
  income: TUnits
  outcomeBankID: TCompanyId | null
  outcomeInstrument: TInstrumentId
  outcomeAccount: TAccountId
  outcome: TUnits
  tag: TTagId[] | null
  merchant: TMerchantId | null
  payee: string | null
  originalPayee: string | null
  comment: string | null
  date: TISODate
  /** ZenMoney may omit the field instead of returning `null`. */
  mcc?: number | null
  reminderMarker: TReminderMarkerId | null
  opIncome: TUnits | null
  opIncomeInstrument: TInstrumentId | null
  opOutcome: TUnits | null
  opOutcomeInstrument: TInstrumentId | null
  latitude: number | null
  longitude: number | null
}

export type TTransaction = Omit<TZmTransaction, 'changed' | 'created'> & {
  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  created: TMsTime
}

/** Fields that a local transaction patch may set directly. */
export const transactionEditableFields = [
  'hold',
  'viewed',
  'qrCode',
  'incomeBankID',
  'incomeInstrument',
  'incomeAccount',
  'income',
  'outcomeBankID',
  'outcomeInstrument',
  'outcomeAccount',
  'outcome',
  'tag',
  'merchant',
  'payee',
  'originalPayee',
  'comment',
  'date',
  'mcc',
  'reminderMarker',
  'opIncome',
  'opIncomeInstrument',
  'opOutcome',
  'opOutcomeInstrument',
  'latitude',
  'longitude',
] as const satisfies readonly (keyof TTransaction)[]

export type TTransactionEditableField =
  (typeof transactionEditableFields)[number]

export type TTransactionEditablePatch = Partial<
  Pick<TTransaction, TTransactionEditableField>
>

/** Fields accepted while creating a replacement transaction. */
export const transactionRecreateFields = [
  'created',
  ...transactionEditableFields,
] as const satisfies readonly (keyof TTransaction)[]

export type TTransactionRecreateField =
  (typeof transactionRecreateFields)[number]

export type TTransactionRecreatePatch = Partial<
  Pick<TTransaction, TTransactionRecreateField>
> &
  Pick<TTransaction, 'created' | 'income' | 'outcome'>
