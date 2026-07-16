import type { TCompanyId } from '../companies'
import type { TInstrumentId } from '../instruments'
import type { TISODate, TMsTime, TUnixTime, TUnits } from '../primitives'
import type { TUserId } from '../users'

export type TAccountId = string

export enum AccountType {
  Cash = 'cash',
  Ccard = 'ccard',
  Checking = 'checking',
  Loan = 'loan',
  Deposit = 'deposit',
  Emoney = 'emoney',
  Debt = 'debt',
}

export type TAccount = {
  id: TAccountId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  user: TUserId
  instrument: TInstrumentId
  title: string
  role: number | null
  company: TCompanyId | null
  type: AccountType
  syncID: string[] | null
  balance: TUnits

  /** For deposit and loan accounts this means initial deposit or loan principal. */
  startBalance: TUnits

  creditLimit: TUnits
  inBalance: boolean
  savings: boolean | null
  enableCorrection: boolean
  balanceCorrectionType: 'request' | null
  enableSMS: boolean
  archive: boolean
  private: boolean

  /** Meaningful only for loan and deposit accounts; otherwise usually null. */
  capitalization: boolean | null

  /** Meaningful only for loan and deposit accounts; otherwise usually null. */
  percent: number | null

  /** Meaningful only for loan and deposit accounts; otherwise usually null. */
  startDate: TISODate | null

  /** Meaningful only for loan and deposit accounts; otherwise usually null. */
  endDateOffset: number | null

  /** Meaningful only for loan and deposit accounts; otherwise usually null. */
  endDateOffsetInterval: 'day' | 'week' | 'month' | 'year' | null

  /** Meaningful only for loan and deposit accounts; otherwise usually null. */
  payoffStep: number | null

  /** Meaningful only for loan and deposit accounts; otherwise usually null. */
  payoffInterval: 'month' | 'year' | null
}

export type TZmAccount = Omit<TAccount, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}
