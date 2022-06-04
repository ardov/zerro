import * as Comlink from 'comlink'
import { TAccount, TMerchant, TReminder } from './types'

// Outlining external interface of the data worker
const workerMethods = {
  applyPatch: () => console.log('applyPatch'),
  setMerchants: (merchants: TMerchant[]) =>
    console.log('setMerchants', merchants),
  setReminders: (reminders: TReminder[]) =>
    console.log('setReminders', reminders),
  setAccounts: (accounts: TAccount[]) => console.log('setAccounts', accounts),
  loadJSON: () => console.log('loadJSON'),
  loadLocalData: () => console.log('loadLocalData'),
  reloadData: () => console.log('reloadData'),
  logIn: () => console.log('logIn'),
  logOut: () => console.log('logOut'),
  sync: () => console.log('sync'),
}

export type TWorkerMethods = typeof workerMethods
Comlink.expose(workerMethods)
