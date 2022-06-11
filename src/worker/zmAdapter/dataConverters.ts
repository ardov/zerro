import parseDate from 'date-fns/parseISO'
import format from 'date-fns/format'
import {
  TInstrument,
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
  ZmDeletionObject,
  DeletionObject,
} from 'types'

const toMs = (date: string | number) =>
  typeof date === 'string' ? +parseDate(date) : date * 1000
const toUnix = (date: number) => date / 1000
const toISODate = (date: number) => format(date, 'yyyy-MM-dd')

export const dataConverters = {
  serverTimestamp: {
    toClient: (time: number) => toMs(time),
    toServer: (time: number) => toUnix(time),
  },

  instrument: {
    toClient: (el: TInstrument): TInstrument => {
      return { ...el, changed: toMs(el.changed) }
    },
    toServer: (el: TInstrument): TInstrument => {
      return { ...el, changed: toUnix(el.changed) }
    },
  },

  company: {
    toClient: (el: Company): Company => {
      return { ...el, changed: toMs(el.changed) }
    },
    toServer: (el: Company): Company => {
      return { ...el, changed: toUnix(el.changed) }
    },
  },

  country: {
    toClient: (el: Country): Country => el,
    toServer: (el: Country): Country => el,
  },

  user: {
    toClient: (el: User): User => {
      return { ...el, changed: toMs(el.changed), paidTill: toMs(el.paidTill) }
    },
    toServer: (el: User): User => {
      return {
        ...el,
        changed: toUnix(el.changed),
        paidTill: toUnix(el.paidTill),
      }
    },
  },

  account: {
    toClient: (el: ZmAccount): Account => ({
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
    toClient: (el: Tag): Tag => {
      return { ...el, changed: toMs(el.changed) }
    },
    toServer: (el: Tag): Tag => {
      return { ...el, changed: toUnix(el.changed) }
    },
  },

  merchant: {
    toClient: (el: Merchant): Merchant => {
      return { ...el, changed: toMs(el.changed) }
    },
    toServer: (el: Merchant): Merchant => {
      return { ...el, changed: toUnix(el.changed) }
    },
  },

  reminder: {
    toClient: (el: ZmReminder): Reminder => ({
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
    toClient: (el: ZmReminderMarker): ReminderMarker => {
      return { ...el, changed: toMs(el.changed), date: toMs(el.date) }
    },
    toServer: (el: ReminderMarker): ZmReminderMarker => {
      return { ...el, changed: toUnix(el.changed), date: toISODate(el.date) }
    },
  },

  transaction: {
    toClient: (el: ZmTransaction): Transaction => ({
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
    toClient: (el: ZmBudget): Budget => {
      return { ...el, changed: toMs(el.changed), date: toMs(el.date) }
    },
    toServer: (el: Budget): ZmBudget => {
      return { ...el, changed: toUnix(el.changed), date: toISODate(el.date) }
    },
  },

  deletion: {
    toClient: (el: ZmDeletionObject): DeletionObject => {
      return { ...el, stamp: toMs(el.stamp) }
    },
    toServer: (el: DeletionObject): ZmDeletionObject => {
      return { ...el, stamp: toUnix(el.stamp) }
    },
  },
}
