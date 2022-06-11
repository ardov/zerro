import { dataStorage } from 'services/storage'
import { TLocalData } from 'types'

export async function getLocalData() {
  const LOCAL_KEYS: (keyof TLocalData)[] = [
    'serverTimestamp',
    'instrument',
    'user',
    'merchant',
    'country',
    'company',
    'reminder',
    'reminderMarker',
    'account',
    'tag',
    'budget',
    'transaction',
  ]

  let data: TLocalData = { serverTimestamp: 0 }
  let arr = await Promise.all(LOCAL_KEYS.map(key => dataStorage.get(key)))
  LOCAL_KEYS.forEach((key, i) => (data[key] = arr[i]))
  return data
}
