import { getIDBStorage } from 'services/storage'
import { LocalData } from 'types'

export async function getLocalData() {
  const LOCAL_KEYS: (keyof LocalData)[] = [
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
  const db = getIDBStorage('serverData')
  let data: LocalData = { serverTimestamp: 0 }
  let arr = await Promise.all(LOCAL_KEYS.map(key => db.get(key)))
  LOCAL_KEYS.forEach((key, i) => (data[key] = arr[i]))
  return data
}
