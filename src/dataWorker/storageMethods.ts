import { getIDBStorage } from 'shared/api/storage'
import { TToken, TUnixTime } from 'shared/types'
import {
  IZmTransaction,
  IZmInstrument,
  IZmCountry,
  IZmCompany,
  IZmUser,
  IZmAccount,
  IZmMerchant,
  IZmTag,
  IZmBudget,
  IZmReminder,
  IZmReminderMarker,
} from 'shared/types'

export type TLocalData = {
  token: TToken
  serverTimestamp: TUnixTime
  instrument: IZmInstrument[]
  country: IZmCountry[]
  company: IZmCompany[]
  user: IZmUser[]
  account: IZmAccount[]
  merchant: IZmMerchant[]
  tag: IZmTag[]
  budget: IZmBudget[]
  reminder: IZmReminder[]
  reminderMarker: IZmReminderMarker[]
  transaction: IZmTransaction[]
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
