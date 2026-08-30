import type { EntityPatch } from '../../../foundation/types'
import type { TAccountId } from '../accounts'
import type { TInstrumentId } from '../instruments'
import type { TMerchantId } from '../merchants'
import type { TMsTime, TISODate, TUnixTime, TUnits } from '../../primitives'
import type { TReminderMarkerId } from '../reminderMarkers'
import type { TTagId } from '../tags'
import type { TUserId } from '../users'

export type TTransactionId = string

/** Opaque plugin-owned bank-operation ID; it is not a company reference. */
export type TBankOperationId = number

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
  incomeBankID: TBankOperationId | null
  incomeInstrument: TInstrumentId
  /**
   * Null only on a soft-deleted row: deleting an account nulls the leg that
   * pointed at it on a debt operation, instead of purging the row (round 9).
   */
  incomeAccount: TAccountId | null
  income: TUnits
  outcomeBankID: TBankOperationId | null
  outcomeInstrument: TInstrumentId
  /** Null only on a soft-deleted row — see `incomeAccount`. */
  outcomeAccount: TAccountId | null
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
const transactionEditableFields = [
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

/** Fields the factory cannot default: creation intent must supply them. */
export const transactionRequiredFields = [
  'date',
  'incomeInstrument',
  'incomeAccount',
  'outcomeInstrument',
  'outcomeAccount',
] as const satisfies readonly (keyof TTransaction)[]

/** Existing transaction fields that may be changed, including lifecycle. */
export const transactionWritableFields = [
  'deleted',
  ...transactionEditableFields,
] as const satisfies readonly (keyof TTransaction)[]

export type TTransactionWritableField =
  (typeof transactionWritableFields)[number]

/** Upsert intent also accepts immutable creation metadata for a missing id. */
export const transactionIntentFields = [
  'created',
  ...transactionWritableFields,
] as const satisfies readonly (keyof TTransaction)[]

export type TTransactionIntentField = (typeof transactionIntentFields)[number]

export type TTransactionPatch = EntityPatch<
  TTransaction,
  TTransactionIntentField
>

/** Fields accepted while creating a replacement transaction. */
export type TTransactionRecreateField = 'created' | TTransactionEditableField

export type TTransactionRecreatePatch = Partial<
  Pick<TTransaction, TTransactionRecreateField>
> &
  Pick<TTransaction, 'created' | 'income' | 'outcome'>
