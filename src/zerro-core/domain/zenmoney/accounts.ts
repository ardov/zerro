import { toISODate } from '../shared/date'
import type {
  ById,
  EntityPatch,
  Modify,
  OptionalExceptFor,
} from '../shared/types'
import type { TCoreContext, TIntentPatch } from '../../types'
import type { TCompanyId } from './companies'
import type { TFxCode, TInstrumentId } from './instruments'
import type {
  TDateDraft,
  TISODate,
  TMsTime,
  TUnixTime,
  TUnits,
} from './primitives'
import { compileEntityPatch, type TDataStore } from './store'
import { getRootUserId } from './users'
import type { TUserId } from './users'

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

/** Account reads must not depend on wider store slices. */
export type TAccountSource = Pick<TDataStore, 'account'>

export function getAccounts(data: TAccountSource): ById<TAccount> {
  return data.account
}

export function getDebtAccountId(data: TAccountSource): TAccountId | undefined {
  const accounts = getAccounts(data)
  for (const id in accounts) {
    if (accounts[id].type === AccountType.Debt) return id
  }
}

export function getAccountList(data: TAccountSource): TAccount[] {
  return Object.values(getAccounts(data))
}

export type TAccountPopulated = TAccount & {
  startBalanceReal: number
  inBudget: boolean
  fxCode: TFxCode
}

/** UI-friendly account projection. Currency metadata stays an explicit input. */
function populateAccount(
  account: TAccount,
  instrumentCodeById: Record<TInstrumentId, TFxCode>
): TAccountPopulated {
  return {
    ...account,
    startBalanceReal: getAccStartBalance(account),
    inBudget: isInBudgetAccount(account),
    fxCode: instrumentCodeById[account.instrument],
  }
}

export function getPopulatedAccounts(
  data: TAccountSource,
  instrumentCodeById: Record<TInstrumentId, TFxCode>
): ById<TAccountPopulated> {
  return Object.fromEntries(
    Object.entries(getAccounts(data)).map(([id, account]) => [
      id,
      populateAccount(account, instrumentCodeById),
    ])
  )
}

export function isInBudgetAccount(account: TAccount): boolean {
  if (account.type === AccountType.Debt) return false
  if (account.title.endsWith('📍')) return true
  return account.inBalance
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

    id: draft.id || (ctx.uuid() as TAccountId),
    changed: draft.changed || ctx.now(),
    role: draft.role || null,
    company: draft.company || null,
    type: draft.type || AccountType.Cash,
    syncID: draft.syncID || null,

    balance: draft.balance || 0,
    startBalance: draft.startBalance || 0,
    creditLimit: draft.creditLimit || 0,

    inBalance: draft.inBalance || false,
    savings: draft.savings || false,
    enableCorrection: draft.enableCorrection || false,
    balanceCorrectionType: draft.balanceCorrectionType || null,
    enableSMS: draft.enableSMS || false,
    archive: draft.archive || false,
    private: draft.private || false,

    capitalization: draft.capitalization || null,
    percent: draft.percent || null,
    startDate: draft.startDate ? toISODate(draft.startDate) : null,
    endDateOffset: draft.endDateOffset || null,
    endDateOffsetInterval: draft.endDateOffsetInterval || null,
    payoffStep: draft.payoffStep || null,
    payoffInterval: draft.payoffInterval || null,
  }
}

export type TAccountDraft = Omit<TAccountFactoryDraft, 'user'>

export function compileCreateAccount(
  data: TDataStore,
  draft: TAccountDraft,
  ctx: TCoreContext
): TIntentPatch {
  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    account: [makeAccount({ ...draft, user }, ctx)],
  }
}

export function compilePatchAccount(
  data: TDataStore,
  patch: TAccountPatch | TAccountPatch[]
): TIntentPatch {
  return compileEntityPatch(data, 'account', patch)
}
