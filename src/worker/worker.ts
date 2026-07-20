import type { EndpointPreference } from '../6-shared/api/zenmoney/endpoints'
import * as Comlink from 'comlink'
import { TNormalizedPatch, TLocalData, TZmDiff } from '../6-shared/types'
import { keys } from '../6-shared/helpers/keys'
import { storage } from '../6-shared/api/storage'
import { zenmoney } from '../6-shared/api/zenmoney'
import { convertDiff } from '../6-shared/api/zm-adapter'
import type { TPersistedReplica } from '../zerro-core/infrastructure/replica/persistence'

const REPLICA_KEY = 'zerro-core-replica-v1'

type LocalKey = keyof TLocalData
const LOCAL_KEYS = [
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

function convertZmToLocal(diff: TZmDiff) {
  return convertDiff.toClient(diff)
}

async function sync(
  token: string,
  preference: EndpointPreference,
  diff: TNormalizedPatch
) {
  const zmDiff = convertDiff.toServer(diff)
  try {
    const data = await zenmoney.fetchDiff(token, preference, zmDiff)
    return { data: convertDiff.toClient(data) }
  } catch (error: any) {
    return { error: error.message as string }
  }
}

async function getLocalData() {
  const data = {} as TLocalData
  const arr = await Promise.all(LOCAL_KEYS.map(key => storage.get(key)))
  LOCAL_KEYS.forEach((key, i) => (data[key] = arr[i]))
  return convertDiff.toClient(data)
}

const obj = {
  convertZmToLocal,
  getLocalData,
  getReplicaState: () => storage.get(REPLICA_KEY) as Promise<unknown>,
  clearStorage: () => storage.clear(),
  saveLocalData: (data: TLocalData) => {
    keys(data).forEach(key => storage.set(key, data[key]))
  },
  saveReplicaState: (replica: TPersistedReplica) =>
    storage.set(REPLICA_KEY, replica),
  sync,
}

export type WorkerObj = typeof obj
Comlink.expose(obj)
