import {
  TAccount,
  TZmAccount,
  TBudget,
  TZmBudget,
  TBudgetId,
  TTagId,
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
  TISODate,
} from '6-shared/types'
import { TZmAdapter } from '6-shared/helpers/adapterUtils'

const unixToMs = (seconds: TUnixTime): TMsTime => seconds * 1000
const msToUnix = (date: TMsTime): TUnixTime => Math.round(date / 1000)

export const toBudgetId = (date: TISODate, tag: TTagId | null): TBudgetId =>
  `${date}#${tag}`

const convertAccount: TZmAdapter<TZmAccount, TAccount> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertBudget: TZmAdapter<TZmBudget, TBudget> = {
  toClient: (el: TZmBudget): TBudget => {
    return {
      ...el,
      changed: unixToMs(el.changed),
      id: toBudgetId(el.date, el.tag),
    }
  },
  toServer: (el: TBudget): TZmBudget => {
    return {
      changed: msToUnix(el.changed),
      user: el.user,
      tag: el.tag,
      date: el.date,
      income: el.income,
      incomeLock: el.incomeLock,
      outcome: el.outcome,
      outcomeLock: el.outcomeLock,
    }
  },
}

const convertCompany: TZmAdapter<TZmCompany, TCompany> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertCountry: TZmAdapter<TZmCountry, TCountry> = {
  toClient: el => el,
  toServer: el => el,
}

const convertInstrument: TZmAdapter<TZmInstrument, TInstrument> = {
  toClient: (el: TZmInstrument): TInstrument => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: (el: TInstrument): TZmInstrument => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertMerchant: TZmAdapter<TZmMerchant, TMerchant> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertReminder: TZmAdapter<TZmReminder, TReminder> = {
  toClient: (el: TZmReminder): TReminder => ({
    ...el,
    changed: unixToMs(el.changed),
  }),
  toServer: (el: TReminder): TZmReminder => ({
    ...el,
    changed: msToUnix(el.changed),
  }),
}

const convertReminderMarker: TZmAdapter<TZmReminderMarker, TReminderMarker> = {
  toClient: (el: TZmReminderMarker): TReminderMarker => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: (el: TReminderMarker): TZmReminderMarker => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertTag: TZmAdapter<TZmTag, TTag> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertTransaction: TZmAdapter<TZmTransaction, TTransaction> = {
  toClient: (el: TZmTransaction): TTransaction => ({
    ...el,
    changed: unixToMs(el.changed),
    created: unixToMs(el.created),
  }),
  toServer: (el: TTransaction): TZmTransaction => ({
    ...el,
    changed: msToUnix(el.changed),
    created: msToUnix(el.created),
  }),
}

const convertUser: TZmAdapter<TZmUser, TUser> = {
  toClient: el => {
    return {
      ...el,
      changed: unixToMs(el.changed),
      paidTill: unixToMs(el.paidTill),
    }
  },
  toServer: el => {
    return {
      ...el,
      changed: msToUnix(el.changed),
      paidTill: msToUnix(el.paidTill),
    }
  },
}

const convertDeletion: TZmAdapter<TZmDeletionObject, TDeletionObject> = {
  toClient: (el: TZmDeletionObject): TDeletionObject => {
    return { ...el, stamp: unixToMs(el.stamp) }
  },
  toServer: (el: TDeletionObject): TZmDeletionObject => {
    return { ...el, stamp: msToUnix(el.stamp) }
  },
}

export const convertDiff: TZmAdapter<TZmDiff, TDiff> = {
  toClient: d => {
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
    return r
  },

  toServer: d => {
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
    return r
  },
}
