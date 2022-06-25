import parseDate from 'date-fns/parseISO'
import format from 'date-fns/format'
import {
  TInstrument,
  TRawUser,
  TRawCountry,
  TCompany,
  TMerchant,
  TRawReminder,
  TZmReminderMarker,
  TRawReminderMarker,
  TRawAccount,
  TRawTag,
  TBudget,
  TRawTransaction,
  TZmAccount,
  TZmReminder,
  TZmTransaction,
  TZmBudget,
  TZmDeletionObject,
  TDeletionObject,
} from 'shared/types'

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
    toClient: (el: TCompany): TCompany => {
      return { ...el, changed: toMs(el.changed) }
    },
    toServer: (el: TCompany): TCompany => {
      return { ...el, changed: toUnix(el.changed) }
    },
  },

  country: {
    toClient: (el: TRawCountry): TRawCountry => el,
    toServer: (el: TRawCountry): TRawCountry => el,
  },

  user: {
    toClient: (el: TRawUser): TRawUser => {
      return { ...el, changed: toMs(el.changed), paidTill: toMs(el.paidTill) }
    },
    toServer: (el: TRawUser): TRawUser => {
      return {
        ...el,
        changed: toUnix(el.changed),
        paidTill: toUnix(el.paidTill),
      }
    },
  },

  account: {
    toClient: (el: TZmAccount): TRawAccount => ({
      ...el,
      changed: toMs(el.changed),
      startDate:
        typeof el.startDate === 'string' ? toMs(el.startDate) : el.startDate,
    }),
    toServer: (el: TRawAccount): TZmAccount => ({
      ...el,
      changed: toUnix(el.changed),
      startDate: el.startDate !== null ? toISODate(el.startDate) : null,
    }),
  },

  tag: {
    toClient: (el: TRawTag): TRawTag => {
      return { ...el, changed: toMs(el.changed) }
    },
    toServer: (el: TRawTag): TRawTag => {
      return { ...el, changed: toUnix(el.changed) }
    },
  },

  merchant: {
    toClient: (el: TMerchant): TMerchant => {
      return { ...el, changed: toMs(el.changed) }
    },
    toServer: (el: TMerchant): TMerchant => {
      return { ...el, changed: toUnix(el.changed) }
    },
  },

  reminder: {
    toClient: (el: TZmReminder): TRawReminder => ({
      ...el,
      changed: toMs(el.changed),
      startDate: toMs(el.startDate),
      endDate: toMs(el.endDate),
    }),
    toServer: (el: TRawReminder): TZmReminder => ({
      ...el,
      changed: toUnix(el.changed),
      startDate: toISODate(el.startDate),
      endDate: toISODate(el.endDate),
    }),
  },

  reminderMarker: {
    toClient: (el: TZmReminderMarker): TRawReminderMarker => {
      return { ...el, changed: toMs(el.changed), date: toMs(el.date) }
    },
    toServer: (el: TRawReminderMarker): TZmReminderMarker => {
      return { ...el, changed: toUnix(el.changed), date: toISODate(el.date) }
    },
  },

  transaction: {
    toClient: (el: TZmTransaction): TRawTransaction => ({
      ...el,
      changed: toMs(el.changed),
      created: toMs(el.created),
      date: toMs(el.date),
    }),
    toServer: (el: TRawTransaction): TZmTransaction => ({
      ...el,
      changed: toUnix(el.changed),
      created: toUnix(el.created),
      date: toISODate(el.date),
    }),
  },

  budget: {
    toClient: (el: TZmBudget): TBudget => {
      return {
        ...el,
        changed: toMs(el.changed),
        date: toMs(el.date),
        id: `${el.date}#${el.tag}`,
      }
    },
    toServer: (el: TBudget): TZmBudget => {
      let converted = {
        ...el,
        changed: toUnix(el.changed),
        date: toISODate(el.date),
        id: undefined,
      }
      delete converted.id
      return converted
    },
  },

  deletion: {
    toClient: (el: TZmDeletionObject): TDeletionObject => {
      return { ...el, stamp: toMs(el.stamp) }
    },
    toServer: (el: TDeletionObject): TZmDeletionObject => {
      return { ...el, stamp: toUnix(el.stamp) }
    },
  },
}
