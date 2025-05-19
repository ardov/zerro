import type {
  TAccount,
  TZmAccount,
  TBudget,
  TZmBudget,
  TZmCompany,
  TCompany,
  TZmCountry,
  TCountry,
  TZmInstrument,
  TInstrument,
  TZmMerchant,
  TMerchant,
  TZmReminder,
  TReminder,
  TZmReminderMarker,
  TReminderMarker,
  TZmTag,
  TTag,
  TZmTransaction,
  TTransaction,
  TZmUser,
  TUser,
  TZmDiff,
  TDiff,
  TZmDeletionObject,
  TDeletionObject,
  TUnixTime,
  TMsTime,
} from '6-shared/types'
import { toBudgetId } from './toBudgetId'

type TZmAdapter<ZmType, ClientType> = {
  toClient: (el: ZmType) => ClientType
  toServer: (el: ClientType) => ZmType
}

const unixToMs = (seconds: TUnixTime): TMsTime => seconds * 1000
const msToUnix = (date: TMsTime): TUnixTime => Math.round(date / 1000)

function changedToMs<T extends { changed: TUnixTime }>(el: T): T {
  return { ...el, changed: unixToMs(el.changed) } as T
}

function changedToUnix<T extends { changed: TMsTime }>(el: T): T {
  return { ...el, changed: msToUnix(el.changed) } as T
}

const convertAccount: TZmAdapter<TZmAccount, TAccount> = {
  toClient: changedToMs,
  toServer: changedToUnix,
}

const convertBudget: TZmAdapter<TZmBudget, TBudget> = {
  toClient: el => changedToMs({ ...el, id: toBudgetId(el.date, el.tag) }),
  toServer: el => {
    const copy = { ...el } as any
    delete copy.id
    return changedToUnix(copy)
  },
}

const convertCompany: TZmAdapter<TZmCompany, TCompany> = {
  toClient: el => changedToMs(el),
  toServer: el => changedToUnix(el),
}

const convertCountry: TZmAdapter<TZmCountry, TCountry> = {
  toClient: el => el,
  toServer: el => el,
}

const convertInstrument: TZmAdapter<TZmInstrument, TInstrument> = {
  toClient: el => changedToMs(el),
  toServer: el => changedToUnix(el),
}

const convertMerchant: TZmAdapter<TZmMerchant, TMerchant> = {
  toClient: el => changedToMs(el),
  toServer: el => changedToUnix(el),
}

const convertReminder: TZmAdapter<TZmReminder, TReminder> = {
  toClient: el => changedToMs(el),
  toServer: el => changedToUnix(el),
}

const convertReminderMarker: TZmAdapter<TZmReminderMarker, TReminderMarker> = {
  toClient: el => changedToMs(el),
  toServer: el => changedToUnix(el),
}

const convertTag: TZmAdapter<TZmTag, TTag> = {
  toClient: el => changedToMs(el),
  toServer: el => changedToUnix(el),
}

const convertTransaction: TZmAdapter<TZmTransaction, TTransaction> = {
  toClient: el => changedToMs({ ...el, created: unixToMs(el.created) }),
  toServer: el => changedToUnix({ ...el, created: msToUnix(el.created) }),
}

const convertUser: TZmAdapter<TZmUser, TUser> = {
  toClient: el => changedToMs({ ...el, paidTill: unixToMs(el.paidTill) }),
  toServer: el => changedToUnix({ ...el, paidTill: msToUnix(el.paidTill) }),
}

const convertDeletion: TZmAdapter<TZmDeletionObject, TDeletionObject> = {
  toClient: el => ({ ...el, stamp: unixToMs(el.stamp) }),
  toServer: el => ({ ...el, stamp: msToUnix(el.stamp) }),
}

export const convertDiff: TZmAdapter<TZmDiff, TDiff> = {
  toClient: d => {
    const t0 = performance.now()
    let r: TDiff = { serverTimestamp: 0 }
    if (d.serverTimestamp) r.serverTimestamp = unixToMs(d.serverTimestamp)
    if (d.deletion) r.deletion = d.deletion.map(convertDeletion.toClient)
    if (d.instrument)
      r.instrument = d.instrument.map(convertInstrument.toClient)
    if (d.country) r.country = d.country.map(convertCountry.toClient)
    if (d.company) r.company = d.company.map(convertCompany.toClient)
    if (d.user) r.user = d.user.map(convertUser.toClient)
    if (d.account) r.account = d.account.map(convertAccount.toClient)
    if (d.merchant) r.merchant = d.merchant.map(convertMerchant.toClient)
    if (d.tag) r.tag = d.tag.map(convertTag.toClient)
    if (d.budget) r.budget = d.budget.map(convertBudget.toClient)
    if (d.reminder) r.reminder = d.reminder.map(convertReminder.toClient)
    if (d.reminderMarker)
      r.reminderMarker = d.reminderMarker.map(convertReminderMarker.toClient)
    if (d.transaction)
      r.transaction = d.transaction.map(convertTransaction.toClient)
    const t1 = performance.now()
    console.log('convertDiff.toClient', t1 - t0)
    return r
  },

  toServer: d => {
    const t0 = performance.now()
    let r: TZmDiff = { serverTimestamp: 0 }
    if (d.serverTimestamp) r.serverTimestamp = msToUnix(d.serverTimestamp)
    if (d.deletion) r.deletion = d.deletion.map(convertDeletion.toServer)
    if (d.instrument)
      r.instrument = d.instrument.map(convertInstrument.toServer)
    if (d.country) r.country = d.country.map(convertCountry.toServer)
    if (d.company) r.company = d.company.map(convertCompany.toServer)
    if (d.user) r.user = d.user.map(convertUser.toServer)
    if (d.account) r.account = d.account.map(convertAccount.toServer)
    if (d.merchant) r.merchant = d.merchant.map(convertMerchant.toServer)
    if (d.tag) r.tag = d.tag.map(convertTag.toServer)
    if (d.budget) r.budget = d.budget.map(convertBudget.toServer)
    if (d.reminder) r.reminder = d.reminder.map(convertReminder.toServer)
    if (d.reminderMarker)
      r.reminderMarker = d.reminderMarker.map(convertReminderMarker.toServer)
    if (d.transaction)
      r.transaction = d.transaction.map(convertTransaction.toServer)
    const t1 = performance.now()
    console.log('convertDiff.toServer', t1 - t0)
    return r
  },
}
