import {
  ById,
  InstrumentId,
  TCompany,
  TCountry,
  TFxCode,
  TFxIdMap,
  TInstrument,
  ZmAccount,
  ZmBudget,
  ZmCompany,
  ZmCountry,
  ZmDiff,
  ZmInstrument,
  ZmMerchant,
  ZmReminder,
  ZmReminderMarker,
  ZmTag,
  ZmTransaction,
  ZmUser,
} from '../types'
import { dataDomain } from './domain'

// Events income
export const applyServerPatch = dataDomain.createEvent<ZmDiff>()
export const applyClientPatch = dataDomain.createEvent<ZmDiff>()
export const resetData = dataDomain.createEvent()
export const loadFromJSON = dataDomain.createEvent()
export const loadLocalData = dataDomain.createEvent()
export const saveDataLocally = dataDomain.createEvent()
export const clearStorage = dataDomain.createEvent()
export const sync = dataDomain.createEvent()
export const logIn = dataDomain.createEvent()
export const logOut = dataDomain.createEvent()
export const exportCSV = dataDomain.createEvent()
export const exportJSON = dataDomain.createEvent()

type RawData = {
  serverTimestamp: number
  instrument: ById<ZmInstrument>
  country: ById<ZmCountry>
  company: ById<ZmCompany>
  user: ById<ZmUser>
  account: ById<ZmAccount>
  merchant: ById<ZmMerchant>
  tag: ById<ZmTag>
  budget: ById<ZmBudget>
  reminder: ById<ZmReminder>
  reminderMarker: ById<ZmReminderMarker>
  transaction: ById<ZmTransaction>
}

const $rawData = dataDomain.createStore<RawData>({
  serverTimestamp: 0,
  instrument: {},
  country: {},
  company: {},
  user: {},
  account: {},
  merchant: {},
  tag: {},
  budget: {},
  reminder: {},
  reminderMarker: {},
  transaction: {},
})

const $diff = dataDomain.createStore<ZmDiff>({
  serverTimestamp: 0,
})

export const $serverTimestamp = dataDomain.createStore<number>(0)
export const $serverInstruments = dataDomain.createStore<ById<ZmInstrument>>({})
export const $serverCountries = dataDomain.createStore<ById<ZmCountry>>({})
export const $serverCompanies = dataDomain.createStore<ById<ZmCompany>>({})
export const $serverUsers = dataDomain.createStore<ById<ZmUser>>({})
export const $serverAccounts = dataDomain.createStore<ById<ZmAccount>>({})
export const $serverMerchants = dataDomain.createStore<ById<ZmMerchant>>({})
export const $serverTags = dataDomain.createStore<ById<ZmTag>>({})
export const $serverBudgets = dataDomain.createStore<ById<ZmBudget>>({})
export const $serverReminders = dataDomain.createStore<ById<ZmReminder>>({})
export const $serverReminderMarkers = dataDomain.createStore<
  ById<ZmReminderMarker>
>({})
export const $serverTransactions = dataDomain.createStore<ById<ZmTransaction>>(
  {}
)

export const $changedInstruments = dataDomain.createStore<ById<ZmInstrument>>(
  {}
)
export const $changedCountries = dataDomain.createStore<ById<ZmCountry>>({})
export const $changedCompanies = dataDomain.createStore<ById<ZmCompany>>({})
export const $changedUsers = dataDomain.createStore<ById<ZmUser>>({})
export const $changedAccounts = dataDomain.createStore<ById<ZmAccount>>({})
export const $changedMerchants = dataDomain.createStore<ById<ZmMerchant>>({})
export const $changedTags = dataDomain.createStore<ById<ZmTag>>({})
export const $changedBudgets = dataDomain.createStore<ById<ZmBudget>>({})
export const $changedReminders = dataDomain.createStore<ById<ZmReminder>>({})
export const $changedReminderMarkers = dataDomain.createStore<
  ById<ZmReminderMarker>
>({})
export const $changedTransactions = dataDomain.createStore<ById<ZmTransaction>>(
  {}
)
