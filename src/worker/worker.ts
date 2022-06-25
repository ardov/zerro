import { TLocalData, TZmDiff, TDiff } from 'shared/types'
import * as Comlink from 'comlink'
import { keys } from 'shared/helpers/keys'
import { storage } from 'shared/api/storage'
import ZenApi from 'shared/api/ZenApi'
import { toClient, toServer } from './zmAdapter'
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
  return toClient(diff)
}

async function sync(token: string, diff: TDiff) {
  const zmDiff = toServer(diff)
  try {
    let data = await ZenApi.getData(token, zmDiff)
    return { data: toClient(data) }
  } catch (error: any) {
    return { error: error.message as string }
  }
}

async function getLocalData() {
  let data = {} as TLocalData
  let arr = await Promise.all(LOCAL_KEYS.map(key => storage.get(key)))
  LOCAL_KEYS.forEach((key, i) => (data[key] = arr[i]))
  return toClient(data)
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
