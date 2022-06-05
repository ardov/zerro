// import * as Comlink from 'comlink'
import { TAccount, TMerchant, TReminder } from './types'

// Outlining external interface of the data worker
export const dataWorkerMethods = {
  logIn: (token: string) => console.log('logIn', token),
  applyPatch: () => console.log('applyPatch'),
  setMerchants: (merchants: TMerchant[]) =>
    console.log('setMerchants', merchants),
  setReminders: (reminders: TReminder[]) =>
    console.log('setReminders', reminders),
  setAccounts: (accounts: TAccount[]) => console.log('setAccounts', accounts),
  loadJSON: () => console.log('loadJSON'),
  loadLocalData: () => console.log('loadLocalData'),
  reloadData: () => console.log('reloadData'),
  logOut: () => console.log('logOut'),
  syncData: (token: string) => console.log('syncData', token),
}

// export type TWorkerMethods = typeof dataWorkerMethods
// Comlink.expose(dataWorkerMethods)
