import { getBudgetId } from 'models/budget'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import {
  TInstrument,
  TUser,
  TCountry,
  TCompany,
  TMerchant,
  TReminder,
  TZmReminderMarker,
  TReminderMarker,
  TAccount,
  TTag,
  TBudget,
  TTransaction,
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
    toClient: (el: TCountry): TCountry => el,
    toServer: (el: TCountry): TCountry => el,
  },

  user: {
    toClient: (el: TUser): TUser => {
      return {
        ...el,
        changed: unixToMs(el.changed),
        paidTill: unixToMs(el.paidTill),
      }
    },
    toServer: (el: TUser): TUser => {
      return {
        ...el,
        changed: msToUnix(el.changed),
        paidTill: msToUnix(el.paidTill),
      }
    },
  },

  account: {
    toClient: (el: TZmAccount): TAccount => ({
      ...el,
      changed: unixToMs(el.changed),
    }),
    toServer: (el: TAccount): TZmAccount => ({
      ...el,
      changed: msToUnix(el.changed),
    }),
  },

  tag: {
    toClient: (el: TTag): TTag => {
      return { ...el, changed: unixToMs(el.changed) }
    },
    toServer: (el: TTag): TTag => {
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
    toClient: (el: TZmReminder): TReminder => ({
      ...el,
      changed: unixToMs(el.changed),
    }),
    toServer: (el: TReminder): TZmReminder => ({
      ...el,
      changed: msToUnix(el.changed),
    }),
  },

  reminderMarker: {
    toClient: (el: TZmReminderMarker): TReminderMarker => {
      return {
        ...el,
        changed: unixToMs(el.changed),
      }
    },
    toServer: (el: TReminderMarker): TZmReminderMarker => {
      return {
        ...el,
        changed: msToUnix(el.changed),
      }
    },
  },

  transaction: {
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
