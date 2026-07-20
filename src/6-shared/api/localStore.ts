import type { TLocalData } from '6-shared/types'
import type { TPersistedReplica } from 'zerro-core/replica'
import { keys } from '6-shared/helpers/keys'
import { storage } from '6-shared/api/storage'
import { convertDiff } from '6-shared/api/zm-adapter'

const REPLICA_KEY = 'zerro-core-replica-v1'

export type LocalKey = keyof TLocalData

/** Domains persisted to IndexedDB, stored in Zenmoney server format. */
export const LOCAL_KEYS = [
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
] as LocalKey[]

export async function getLocalData() {
  const data = {} as TLocalData
  const arr = await Promise.all(LOCAL_KEYS.map(key => storage.get(key)))
  LOCAL_KEYS.forEach((key, i) => (data[key] = arr[i]))
  return convertDiff.toClient(data)
}

export function saveLocalData(data: TLocalData) {
  return Promise.all(keys(data).map(key => storage.set(key, data[key])))
}

export function getReplicaState() {
  return storage.get(REPLICA_KEY) as Promise<unknown>
}

export function saveReplicaState(replica: TPersistedReplica) {
  return storage.set(REPLICA_KEY, replica)
}

export function clearStorage() {
  return storage.clear()
}
