import {
  IAccount,
  IZmAccount,
  IBudget,
  IZmBudget,
  TBudgetId,
  TTagId,
  IZmCompany,
  ICompany,
  IZmCountry,
  ICountry,
  IZmInstrument,
  IInstrument,
  IZmMerchant,
  IMerchant,
  IZmReminder,
  IReminder,
  IZmReminderMarker,
  IReminderMarker,
  IZmTag,
  ITag,
  IZmTransaction,
  ITransaction,
  IZmUser,
  IUser,
  IZmDiff,
  IDiff,
  IZmDeletionObject,
  IDeletionObject,
  TUnixTime,
  TMsTime,
  TISODate,
} from '@shared/types'
import { TZmAdapter } from '@shared/helpers/adapterUtils'

const unixToMs = (seconds: TUnixTime): TMsTime => seconds * 1000
const msToUnix = (date: TMsTime): TUnixTime => Math.round(date / 1000)

export const toBudgetId = (date: TISODate, tag: TTagId | null): TBudgetId =>
  `${date}#${tag}`

const convertAccount: TZmAdapter<IZmAccount, IAccount> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertBudget: TZmAdapter<IZmBudget, IBudget> = {
  toClient: (el: IZmBudget): IBudget => {
    return {
      ...el,
      changed: unixToMs(el.changed),
      id: toBudgetId(el.date, el.tag),
    }
  },
  toServer: (el: IBudget): IZmBudget => {
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

const convertCompany: TZmAdapter<IZmCompany, ICompany> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertCountry: TZmAdapter<IZmCountry, ICountry> = {
  toClient: el => el,
  toServer: el => el,
}

const convertInstrument: TZmAdapter<IZmInstrument, IInstrument> = {
  toClient: (el: IZmInstrument): IInstrument => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: (el: IInstrument): IZmInstrument => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertMerchant: TZmAdapter<IZmMerchant, IMerchant> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertReminder: TZmAdapter<IZmReminder, IReminder> = {
  toClient: (el: IZmReminder): IReminder => ({
    ...el,
    changed: unixToMs(el.changed),
  }),
  toServer: (el: IReminder): IZmReminder => ({
    ...el,
    changed: msToUnix(el.changed),
  }),
}

const convertReminderMarker: TZmAdapter<IZmReminderMarker, IReminderMarker> = {
  toClient: (el: IZmReminderMarker): IReminderMarker => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: (el: IReminderMarker): IZmReminderMarker => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertTag: TZmAdapter<IZmTag, ITag> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

const convertTransaction: TZmAdapter<IZmTransaction, ITransaction> = {
  toClient: (el: IZmTransaction): ITransaction => ({
    ...el,
    changed: unixToMs(el.changed),
    created: unixToMs(el.created),
  }),
  toServer: (el: ITransaction): IZmTransaction => ({
    ...el,
    changed: msToUnix(el.changed),
    created: msToUnix(el.created),
  }),
}

const convertUser: TZmAdapter<IZmUser, IUser> = {
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

const convertDeletion: TZmAdapter<IZmDeletionObject, IDeletionObject> = {
  toClient: (el: IZmDeletionObject): IDeletionObject => {
    return { ...el, stamp: unixToMs(el.stamp) }
  },
  toServer: (el: IDeletionObject): IZmDeletionObject => {
    return { ...el, stamp: msToUnix(el.stamp) }
  },
}

export const convertDiff: TZmAdapter<IZmDiff, IDiff> = {
  toClient: d => {
    let r: IDiff = { serverTimestamp: 0 }
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
    let r: IZmDiff = { serverTimestamp: 0 }
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
