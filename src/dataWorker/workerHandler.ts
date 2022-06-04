// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!./worker'
import { wrap as comlinkWrap } from 'comlink'
import { TWorkerMethods } from './worker'

const worker = new Worker()

export const dataMethods = comlinkWrap<TWorkerMethods>(worker)

// type Message = {
//   action: string
//   payload?: any
// }

// const subscribe = (callback: any) => {
//   worker.addEventListener('message', callback)
// }
// const unsubscribe = (callback: any) => {
//   worker.removeEventListener('message', callback)
// }
// const sendMessage = (message: Message) => {
//   worker.postMessage(message)
// }
