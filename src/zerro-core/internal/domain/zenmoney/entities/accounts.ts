import { toISODate } from '../../foundation/date'
import type {
  ById,
  EntityPatch,
  Modify,
  OptionalExceptFor,
  TOpenEnum,
} from '../../foundation/types'
import type { TCoreContext } from '../../../../types'
import type { TCompanyId } from './companies'
import type { TInstrumentId } from './instruments'
import type {
  TDateDraft,
  TISODate,
  TMsTime,
  TUnixTime,
  TUnits,
} from '../../foundation/primitives'
import { compileExistingEntityPatch } from './patch'
import { getRootUserId } from './users'
import type { TUser, TUserId } from './users'

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

/**
 * ZenMoney owns these discriminators and may add values before Zerro knows
 * their behavior. The known values are listed once here: the domain type, the
 * wire schema and the backup warning all read the same list, and an unknown
 * string stays representable so a complete backup can still be restored.
 */
export const accountTypes = Object.values(AccountType)

export const balanceCorrectionTypes = [
  'request',
  'createCorrection',
  'disabled',
] as const

export const accountOffsetIntervals = ['day', 'week', 'month', 'year'] as const

export const accountPayoffIntervals = ['month', 'year'] as const

export type TAccountType = TOpenEnum<AccountType>

export type TBalanceCorrectionType = TOpenEnum<
  (typeof balanceCorrectionTypes)[number]
>

export type TAccountOffsetInterval = TOpenEnum<
  (typeof accountOffsetIntervals)[number]
>

export type TAccountPayoffInterval = TOpenEnum<
  (typeof accountPayoffIntervals)[number]
>

export type TAccount = {
  id: TAccountId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  user: TUserId
  instrument: TInstrumentId
  title: string
  role: number | null
  company: TCompanyId | null
  type: TAccountType
  syncID: string[] | null
  balance: TUnits

  /** For deposit and loan accounts this means initial deposit or loan principal. */
  startBalance: TUnits

  creditLimit: TUnits
  inBalance: boolean
  savings: boolean | null
  enableCorrection: boolean
  balanceCorrectionType: TBalanceCorrectionType | null
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
  endDateOffsetInterval: TAccountOffsetInterval | null

  /** Meaningful only for loan and deposit accounts; otherwise usually null. */
  payoffStep: number | null

  /** Meaningful only for loan and deposit accounts; otherwise usually null. */
  payoffInterval: TAccountPayoffInterval | null
}

/** Fields the factory cannot default: creation intent must supply them. */
export const accountRequiredFields = [
  'instrument',
  'title',
] as const satisfies readonly (keyof TAccount)[]

export const accountWritableFields = [
  'instrument',
  'title',
  'role',
  'company',
  'type',
  'syncID',
  'startBalance',
  'creditLimit',
  'inBalance',
  'savings',
  'enableCorrection',
  'balanceCorrectionType',
  'enableSMS',
  'archive',
  'private',
  'capitalization',
  'percent',
  'startDate',
  'endDateOffset',
  'endDateOffsetInterval',
  'payoffStep',
  'payoffInterval',
] as const satisfies readonly (keyof TAccount)[]

export type TAccountWritableField = (typeof accountWritableFields)[number]

export type TAccountPatch = EntityPatch<TAccount, TAccountWritableField>

export type TZmAccount = Omit<TAccount, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}

export type TAccountIntent = { account: TAccountPatch[] }

export function getDebtAccountId(
  accounts: ById<TAccount>
): TAccountId | undefined {
  for (const id in accounts) {
    if (accounts[id].type === AccountType.Debt) return id
  }
}

export function getAccountList(accounts: ById<TAccount>): TAccount[] {
  return Object.values(accounts)
}

export function getAccStartBalance(acc: TAccount): number {
  // For deposit and loan field `startBalance` means initial deposit/loan amount
  if (acc.type === AccountType.Deposit) return 0
  if (acc.type === AccountType.Loan) return 0
  return acc.startBalance
}

export type TAccountFactoryDraft = Modify<
  OptionalExceptFor<TAccount, 'user' | 'instrument' | 'title'>,
  { startDate?: TDateDraft | null }
>

export function makeAccount(
  draft: TAccountFactoryDraft,
  ctx: TCoreContext
): TAccount {
  return {
    user: draft.user,
    instrument: draft.instrument,
    title: draft.title,

    id: draft.id ?? (ctx.uuid() as TAccountId),
    changed: draft.changed ?? ctx.now(),
    role: draft.role ?? null,
    company: draft.company ?? null,
    type: draft.type ?? AccountType.Cash,
    syncID: draft.syncID ?? null,

    balance: draft.balance ?? 0,
    startBalance: draft.startBalance ?? 0,
    creditLimit: draft.creditLimit ?? 0,

    inBalance: draft.inBalance ?? false,
    savings: draft.savings === undefined ? false : draft.savings,
    enableCorrection: draft.enableCorrection ?? false,
    balanceCorrectionType: draft.balanceCorrectionType ?? null,
    enableSMS: draft.enableSMS ?? false,
    archive: draft.archive ?? false,
    private: draft.private ?? false,

    capitalization: draft.capitalization ?? null,
    percent: draft.percent ?? null,
    startDate: draft.startDate == null ? null : toISODate(draft.startDate),
    endDateOffset: draft.endDateOffset ?? null,
    endDateOffsetInterval: draft.endDateOffsetInterval ?? null,
    payoffStep: draft.payoffStep ?? null,
    payoffInterval: draft.payoffInterval ?? null,
  }
}

export type TAccountDraft = Omit<TAccountFactoryDraft, 'user'>

export function compileCreateAccount(
  users: ById<TUser>,
  draft: TAccountDraft,
  ctx: TCoreContext
): TAccountIntent {
  const user = getRootUserId(users)
  if (!user) throw new Error('No user')

  return {
    account: [makeAccount({ ...draft, user }, ctx)],
  }
}

export function compilePatchAccount(
  accounts: ById<TAccount>,
  patch: TAccountPatch | TAccountPatch[]
): TAccountIntent {
  return compileExistingEntityPatch(accounts, 'account', patch)
}
