import type { EndpointPreference } from '../6-shared/config'
import * as Comlink from 'comlink'
import { TDiff, TLocalData, TZmDiff } from '../6-shared/types'
import { keys } from '../6-shared/helpers/keys'
import { storage } from '../6-shared/api/storage'
import { zenmoney } from '../6-shared/api/zenmoney'
import { convertDiff } from '../6-shared/api/zm-adapter'

// import { workerMethods } from 'dataWorker'

// eslint-disable-next-line no-restricted-globals
// const ctx: Worker = self as any
// type Action = { payload: any; type: string }
// function dispatch(action: Action) {
//   ctx.postMessage(action)
//   // ctx.addEventListener('message', handleMessage)
// }
// function getState() {
//   return store
// }

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
  diff: TDiff
) {
  const zmDiff = convertDiff.toServer(diff)
  try {
    let data = await zenmoney.fetchDiff(token, preference, zmDiff)
    return { data: convertDiff.toClient(data) }
  } catch (error: any) {
    return { error: error.message as string }
  }
}

async function getLocalData() {
  let data = {} as TLocalData
  let arr = await Promise.all(LOCAL_KEYS.map(key => storage.get(key)))
  LOCAL_KEYS.forEach((key, i) => (data[key] = arr[i]))
  return convertDiff.toClient(data)
}

const obj = {
  convertZmToLocal,
  getLocalData,
  clearStorage: () => storage.clear(),
  saveLocalData: (data: TLocalData) => {
    keys(data).forEach(key => storage.set(key, data[key]))
  },
  sync,
}

export type WorkerObj = typeof obj
Comlink.expose(obj)
