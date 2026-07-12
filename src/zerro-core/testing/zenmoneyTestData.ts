import type { ById } from '../domain/shared/types'
import type { TAccount } from '../domain/zenmoney/accounts/types'
import type { TBudget } from '../domain/zenmoney/budgets/types'
import type { TDataStore } from '../domain/zenmoney/store'
import type { TInstrument } from '../domain/zenmoney/instruments/types'
import type { TMerchant } from '../domain/zenmoney/merchants/types'
import type { TReminder } from '../domain/zenmoney/reminders/types'
import type { TReminderMarker } from '../domain/zenmoney/reminderMarkers/types'
import type { TTag } from '../domain/zenmoney/tags/types'
import type { TTransaction } from '../domain/zenmoney/transactions/types'
import type { TUser } from '../domain/zenmoney/users/types'

export function makeStore(patch: Partial<TDataStore> = {}): TDataStore {
  return {
    serverTimestamp: 0,
    instrument: {},
    country: {},
    company: {},
    user: {},
    merchant: {},
    account: {},
    tag: {},
    budget: {},
    reminder: {},
    reminderMarker: {},
    transaction: {},
    ...patch,
  } as TDataStore
}

export function makeAccount(
  patch: Partial<TAccount> & { id: string }
): TAccount {
  return {
    user: 1,
    instrument: 1,
    title: '',
    changed: 0,
    role: null,
    company: null,
    type: 'cash',
    syncID: null,
    balance: 0,
    startBalance: 0,
    creditLimit: 0,
    inBalance: false,
    savings: false,
    enableCorrection: false,
    balanceCorrectionType: null,
    enableSMS: false,
    archive: false,
    private: false,
    capitalization: null,
    percent: null,
    startDate: null,
    endDateOffset: null,
    endDateOffsetInterval: null,
    payoffStep: null,
    payoffInterval: null,
    ...patch,
  } as TAccount
}

export function makeTransaction(
  patch: Partial<TTransaction> & { id?: string } = {}
): TTransaction {
  return {
    id: 'tr',
    changed: 1,
    created: 1,
    user: 1,
    deleted: false,
    hold: null,
    viewed: false,
    qrCode: null,
    incomeBankID: null,
    income: 0,
    incomeInstrument: 1,
    incomeAccount: 'cash',
    outcomeBankID: null,
    outcome: 0,
    outcomeInstrument: 1,
    outcomeAccount: 'card',
    tag: null,
    merchant: null,
    payee: null,
    originalPayee: null,
    comment: null,
    date: '2026-01-10',
    mcc: null,
    reminderMarker: null,
    opIncome: 0,
    opIncomeInstrument: null,
    opOutcome: 0,
    opOutcomeInstrument: null,
    latitude: null,
    longitude: null,
    ...patch,
  } as TTransaction
}

export function makeInstrument(
  patch: Partial<TInstrument> & { id: number }
): TInstrument {
  return {
    changed: 0,
    title: '',
    shortTitle: '',
    symbol: '',
    rate: 1,
    ...patch,
  } as TInstrument
}

export function makeMerchant(
  patch: Partial<TMerchant> & { id: string }
): TMerchant {
  return {
    changed: 0,
    user: 1,
    title: '',
    ...patch,
  } as TMerchant
}

export function makeTag(patch: Partial<TTag> & { id: string }): TTag {
  return {
    changed: 0,
    user: 1,
    title: '',
    parent: null,
    icon: null,
    staticId: null,
    picture: null,
    color: null,
    showIncome: false,
    showOutcome: false,
    budgetIncome: false,
    budgetOutcome: false,
    required: false,
    archive: false,
    ...patch,
  } as TTag
}

export function makeUser(
  patch: Partial<TUser> & Pick<TUser, 'id' | 'parent' | 'currency'>
): TUser {
  return {
    changed: 0,
    country: 1,
    countryCode: 'US',
    email: null,
    login: null,
    monthStartDay: 1,
    isForecastEnabled: false,
    planBalanceMode: 'balance',
    planSettings: '',
    paidTill: 0,
    subscription: '',
    subscriptionRenewalDate: null,
    ...patch,
  }
}

export function makeReminder(
  patchOrId: (Partial<TReminder> & { id: string }) | string,
  comment?: unknown
): TReminder {
  const patch =
    typeof patchOrId === 'string'
      ? { id: patchOrId, comment: JSON.stringify(comment) }
      : patchOrId

  return {
    changed: 1,
    user: 1,
    incomeInstrument: 2,
    incomeAccount: 'cash',
    income: 0,
    outcomeInstrument: 2,
    outcomeAccount: 'card',
    outcome: 0,
    tag: null,
    merchant: null,
    payee: null,
    comment: null,
    interval: null,
    step: 0,
    points: [0],
    startDate: '2026-01-01',
    endDate: '2026-01-01',
    notify: false,
    ...patch,
    id: patch.id,
  } as TReminder
}

export function makeBudget(patch: Partial<TBudget> & { id: string }): TBudget {
  return {
    changed: 1,
    user: 1,
    date: '2026-01-01',
    tag: 'food',
    income: 0,
    incomeLock: true,
    outcome: 0,
    outcomeLock: true,
    ...patch,
  } as TBudget
}

export function makeReminderMarker(
  patch: Partial<TReminderMarker> & { id: string }
): TReminderMarker {
  return {
    changed: 1,
    user: 1,
    incomeInstrument: 2,
    incomeAccount: 'cash',
    income: 0,
    outcomeInstrument: 2,
    outcomeAccount: 'card',
    outcome: 0,
    tag: null,
    merchant: null,
    payee: null,
    comment: null,
    date: '2026-01-01',
    reminder: 'reminder',
    state: 'planned',
    notify: false,
    ...patch,
    id: patch.id,
  } as TReminderMarker
}

export const usdInstrument = makeInstrument({
  id: 1,
  changed: 1,
  title: 'US Dollar',
  shortTitle: 'USD',
  symbol: '$',
  rate: 1,
})

export const usdInstruments: ById<TInstrument> = {
  1: usdInstrument,
}
