// @ts-ignore Module not found
// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from './worker?worker'
import * as Comlink from 'comlink'
import { WorkerObj } from './worker'
import { AppDispatch } from 'store'

type Message = { action: string; payload?: any }

const worker = new Worker()

export const subscribe = (callback: any) => {
  worker.addEventListener('message', callback)
}
export const unsubscribe = (callback: any) => {
  worker.removeEventListener('message', callback)
}
export const sendMessage = (message: Message) => {
  worker.postMessage(message)
}

export const bindWorkerToStore = (dispatch: AppDispatch) =>
  worker.addEventListener('message', (message: any) => {
    if (typeof message.data?.action === 'string') {
      console.log(`⚙️ ${message.data?.action}`, message.data)
      // dispatch(message.data)
    }
  })

export const workerMethods = Comlink.wrap<WorkerObj>(worker)

export const {
  convertZmToLocal,
  getLocalData,
  clearStorage,
  saveLocalData,
  sync,
} = workerMethods
