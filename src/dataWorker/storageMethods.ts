import { getIDBStorage } from 'shared/api/storage'
import {
  TToken,
  TUnixTime,
  TZmAccount,
  TZmBudget,
  TZmCompany,
  TZmCountry,
  TZmInstrument,
  TZmMerchant,
  TZmReminder,
  TZmReminderMarker,
  TZmTag,
  TZmTransaction,
  TZmUser,
} from 'types'

export type TLocalData = {
  token: TToken
  serverTimestamp: TUnixTime
  instrument: TZmInstrument[]
  country: TZmCountry[]
  company: TZmCompany[]
  user: TZmUser[]
  account: TZmAccount[]
  merchant: TZmMerchant[]
  tag: TZmTag[]
  budget: TZmBudget[]
  reminder: TZmReminder[]
  reminderMarker: TZmReminderMarker[]
  transaction: TZmTransaction[]
}

type TLocalDataKey = keyof TLocalData

const localKeys: TLocalDataKey[] = [
  'token',
  'serverTimestamp',
  'instrument',
  'country',
  'company',
  'user',
  'account',
  'merchant',
  'tag',
  'budget',
  'reminder',
  'reminderMarker',
  'transaction',
]

const BASE_NAME = 'zerro_data'
const STORE_NAME = 'serverData'

const storage = getIDBStorage(BASE_NAME, STORE_NAME)

export async function getLocalData() {
  let data: TLocalData = {
    token: '',
    serverTimestamp: 0,
    instrument: [],
    country: [],
    company: [],
    user: [],
    account: [],
    merchant: [],
    tag: [],
    budget: [],
    reminder: [],
    reminderMarker: [],
    transaction: [],
  }
  await Promise.all(localKeys.map(key => storage.get(key)))
  // @ts-ignore Have no idea how to type this 😆
  localKeys.forEach((key, i) => (data[key] = arr[i]))

  return data
}

export async function setLocalKey<Key extends TLocalDataKey>(
  key: Key,
  value: TLocalData[Key]
) {
  return await storage.set(key, value)
}

export async function clearStorage() {
  return await storage.clear()
}
