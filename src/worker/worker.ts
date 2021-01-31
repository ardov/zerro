import { LocalData, ZmRequest } from 'types'
import * as Comlink from 'comlink'
import { keys } from 'helpers/keys'
import { getIDBStorage } from 'services/storage'
import { store } from './store'
import ZenApi from 'services/ZenApi'

// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any
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
type Action = { payload: any; type: string }
function dispatch(action: Action) {
  ctx.postMessage(action)
  // ctx.addEventListener('message', handleMessage)
}
function getState() {
  return store
}

function sync(diff?: ZmRequest) {}

const db = getIDBStorage('serverData')

async function initWithToken(token: string) {
  store.syncState = 'pending'
  ZenApi.getData(token).then(
    data => {
      store.token = token
      db.set('token', token)
      store.syncState = 'finished'
      store.lastSync = { finishedAt: Date.now(), isSuccessful: true }
      // convert data
      // send to front
      // save locally
    },
    error => {}
  )
}

async function getLocalData() {
  let data = {} as LocalData
  let arr = await Promise.all(LOCAL_KEYS.map(key => db.get(key)))
  LOCAL_KEYS.forEach((key, i) => (data[key] = arr[i]))
  return data
}

const obj = {
  getLocalData,
  clearStorage: () => db.clear(),
  saveLocalData: (data: LocalData) => {
    keys(data).forEach(key => db.set(key, data[key]))
  },
  sync: (token: string) => {},
}

export type WorkerObj = typeof obj

Comlink.expose(obj)
