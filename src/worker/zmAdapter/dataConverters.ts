import { getBudgetId } from 'models/budgets'
import { msToUnix, unixToMs } from 'shared/helpers/date'
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

export const dataConverters = {
  serverTimestamp: {
    toClient: (time: number) => unixToMs(time),
    toServer: (time: number) => msToUnix(time),
  },

  instrument: {
    toClient: (el: TInstrument): TInstrument => {
      return { ...el, changed: unixToMs(el.changed) }
    },
    toServer: (el: TInstrument): TInstrument => {
      return { ...el, changed: msToUnix(el.changed) }
    },
  },

  company: {
    toClient: (el: TCompany): TCompany => {
      return { ...el, changed: unixToMs(el.changed) }
    },
    toServer: (el: TCompany): TCompany => {
      return { ...el, changed: msToUnix(el.changed) }
    },
  },

  country: {
    toClient: (el: TRawCountry): TRawCountry => el,
    toServer: (el: TRawCountry): TRawCountry => el,
  },

  user: {
    toClient: (el: TRawUser): TRawUser => {
      return {
        ...el,
        changed: unixToMs(el.changed),
        paidTill: unixToMs(el.paidTill),
      }
    },
    toServer: (el: TRawUser): TRawUser => {
      return {
        ...el,
        changed: msToUnix(el.changed),
        paidTill: msToUnix(el.paidTill),
      }
    },
  },

  account: {
    toClient: (el: TZmAccount): TRawAccount => ({
      ...el,
      changed: unixToMs(el.changed),
    }),
    toServer: (el: TRawAccount): TZmAccount => ({
      ...el,
      changed: msToUnix(el.changed),
    }),
  },

  tag: {
    toClient: (el: TRawTag): TRawTag => {
      return { ...el, changed: unixToMs(el.changed) }
    },
    toServer: (el: TRawTag): TRawTag => {
      return { ...el, changed: msToUnix(el.changed) }
    },
  },

  merchant: {
    toClient: (el: TMerchant): TMerchant => {
      return { ...el, changed: unixToMs(el.changed) }
    },
    toServer: (el: TMerchant): TMerchant => {
      return { ...el, changed: msToUnix(el.changed) }
    },
  },

  reminder: {
    toClient: (el: TZmReminder): TRawReminder => ({
      ...el,
      changed: unixToMs(el.changed),
    }),
    toServer: (el: TRawReminder): TZmReminder => ({
      ...el,
      changed: msToUnix(el.changed),
    }),
  },

  reminderMarker: {
    toClient: (el: TZmReminderMarker): TRawReminderMarker => {
      return {
        ...el,
        changed: unixToMs(el.changed),
      }
    },
    toServer: (el: TRawReminderMarker): TZmReminderMarker => {
      return {
        ...el,
        changed: msToUnix(el.changed),
      }
    },
  },

  transaction: {
    toClient: (el: TZmTransaction): TRawTransaction => ({
      ...el,
      changed: unixToMs(el.changed),
      created: unixToMs(el.created),
    }),
    toServer: (el: TRawTransaction): TZmTransaction => ({
      ...el,
      changed: msToUnix(el.changed),
      created: msToUnix(el.created),
    }),
  },

  budget: {
    toClient: (el: TZmBudget): TBudget => {
      return {
        ...el,
        changed: unixToMs(el.changed),
        id: getBudgetId(el.date, el.tag),
      }
    },
    toServer: (el: TBudget): TZmBudget => {
      let converted = {
        ...el,
        changed: msToUnix(el.changed),
        id: undefined,
      }
      delete converted.id
      return converted
    },
  },

  deletion: {
    toClient: (el: TZmDeletionObject): TDeletionObject => {
      return { ...el, stamp: unixToMs(el.stamp) }
    },
    toServer: (el: TDeletionObject): TZmDeletionObject => {
      return { ...el, stamp: msToUnix(el.stamp) }
    },
  },
}
