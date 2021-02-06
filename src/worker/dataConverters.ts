import parseDate from 'date-fns/parseISO'
import format from 'date-fns/format'
import {
  Instrument,
  User,
  Country,
  Company,
  Merchant,
  Reminder,
  ZmReminderMarker,
  ReminderMarker,
  Account,
  Tag,
  Budget,
  Transaction,
  ZmAccount,
  ZmReminder,
  ZmTransaction,
  ZmBudget,
} from 'types'

const toMs = (date: string | number) =>
  typeof date === 'string' ? +parseDate(date) : date * 1000
const toUnix = (date: number) => date / 1000
const toISODate = (date: number) => format(date, 'yyyy-MM-dd')

export const dataConverters = {
  serverTimestamp: {
    toLocal: (time: number) => toMs(time),
    toServer: (time: number) => toUnix(time),
  },

  instrument: {
    toLocal: (el: Instrument): Instrument => ({
      ...el,
      changed: toMs(el.changed),
    }),
    toServer: (el: Instrument): Instrument => ({
      ...el,
      changed: toUnix(el.changed),
    }),
  },

  company: {
    toLocal: (el: Company): Company => ({
      ...el,
      changed: toMs(el.changed),
    }),
    toServer: (el: Company): Company => ({
      ...el,
      changed: toUnix(el.changed),
    }),
  },

  country: {
    toLocal: (el: Country): Country => el,
    toServer: (el: Country): Country => el,
  },

  user: {
    toLocal: (el: User): User => ({
      ...el,
      changed: toMs(el.changed),
      paidTill: toMs(el.paidTill),
    }),
    toServer: (el: User): User => ({
      ...el,
      changed: toUnix(el.changed),
      paidTill: toUnix(el.paidTill),
    }),
  },

  account: {
    toLocal: (el: ZmAccount): Account => ({
      ...el,
      changed: toMs(el.changed),
      startDate:
        typeof el.startDate === 'string' ? toMs(el.startDate) : el.startDate,
    }),
    toServer: (el: Account): ZmAccount => ({
      ...el,
      changed: toUnix(el.changed),
      startDate: el.startDate !== null ? toISODate(el.startDate) : null,
    }),
  },

  tag: {
    toLocal: (el: Tag): Tag => ({
      ...el,
      changed: toMs(el.changed),
    }),
    toServer: (el: Tag): Tag => ({
      ...el,
      changed: toUnix(el.changed),
    }),
  },

  merchant: {
    toLocal: (el: Merchant): Merchant => ({
      ...el,
      changed: toMs(el.changed),
    }),
    toServer: (el: Merchant): Merchant => ({
      ...el,
      changed: toUnix(el.changed),
    }),
  },

  reminder: {
    toLocal: (el: ZmReminder): Reminder => ({
      ...el,
      changed: toMs(el.changed),
      startDate: toMs(el.startDate),
      endDate: toMs(el.endDate),
    }),
    toServer: (el: Reminder): ZmReminder => ({
      ...el,
      changed: toUnix(el.changed),
      startDate: toISODate(el.startDate),
      endDate: toISODate(el.endDate),
    }),
  },

  reminderMarker: {
    toLocal: (el: ZmReminderMarker): ReminderMarker => ({
      ...el,
      changed: toMs(el.changed),
      date: toMs(el.date),
    }),
    toServer: (el: ReminderMarker): ZmReminderMarker => ({
      ...el,
      changed: toUnix(el.changed),
      date: toISODate(el.date),
    }),
  },

  transaction: {
    toLocal: (el: ZmTransaction): Transaction => ({
      ...el,
      changed: toMs(el.changed),
      created: toMs(el.created),
      date: toMs(el.date),
    }),
    toServer: (el: Transaction): ZmTransaction => ({
      ...el,
      changed: toUnix(el.changed),
      created: toUnix(el.created),
      date: toISODate(el.date),
    }),
  },

  budget: {
    toLocal: (el: ZmBudget): Budget => ({
      ...el,
      changed: toMs(el.changed),
      date: toMs(el.date),
    }),
    toServer: (el: Budget): ZmBudget => ({
      ...el,
      changed: toUnix(el.changed),
      date: toISODate(el.date),
    }),
  },
}
