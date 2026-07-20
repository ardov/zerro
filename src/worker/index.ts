import Worker from './worker?worker'
import * as Comlink from 'comlink'
import { WorkerObj } from './worker'

const worker = new Worker()

export const {
  convertZmToLocal,
  getLocalData,
  getReplicaState,
  clearStorage,
  saveLocalData,
  saveReplicaState,
  sync,
} = Comlink.wrap<WorkerObj>(worker)
