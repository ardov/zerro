// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!./dataWorker?name=DataWorker'
import { wrap as comlinkWrap } from 'comlink'
import { TWorkerMethods } from './dataWorker'

const dataWorker = new Worker()

export const worker = comlinkWrap<TWorkerMethods>(dataWorker)

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
