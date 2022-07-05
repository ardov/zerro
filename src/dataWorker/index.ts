import { TLocalData } from 'shared/types'
import { convertDiff } from 'models/diff'

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

export const workerMethods = {
  // logIn: loggedIn,
  convertZmToLocal: convertDiff.toClient,
  // getLocalData: () => {
  //   initTriggered()
  //   return getLocalDataFx()
  // },
  // clearStorage: logOutTriggered,
  saveLocalData: (data: TLocalData) => {
    console.log('saveLocalData', data)
    // keys(data).forEach(key => storage.set(key, data[key]))
  },
  // sync: syncFx,
}
