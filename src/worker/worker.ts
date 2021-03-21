import { LocalData, ZmDiff, Diff } from 'types'
import * as Comlink from 'comlink'
import { keys } from 'helpers/keys'
import { getIDBStorage } from 'services/storage'
import ZenApi from 'services/ZenApi'
import { toClient, toServer } from './zmAdapter'

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

type LocalKey = keyof LocalData
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

function convertZmToLocal(diff: ZmDiff) {
  return toClient(diff)
}

async function sync(token: string, diff: Diff) {
  const zmDiff = toServer(diff)
  try {
    let data = await ZenApi.getData(token, zmDiff)
    return { data: toClient(data) }
  } catch (error) {
    return { error: error.message as string }
  }
}

const db = getIDBStorage('serverData')

async function getLocalData() {
  let data = {} as LocalData
  let arr = await Promise.all(LOCAL_KEYS.map(key => db.get(key)))
  LOCAL_KEYS.forEach((key, i) => (data[key] = arr[i]))
  return toClient(data)
}

const obj = {
  convertZmToLocal,
  getLocalData,
  clearStorage: () => db.clear(),
  saveLocalData: (data: LocalData) => {
    keys(data).forEach(key => db.set(key, data[key]))
  },
  sync,
}

export type WorkerObj = typeof obj
Comlink.expose(obj)
