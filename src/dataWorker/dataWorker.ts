import { logInFx } from 'data/effector'
import { TAccount, TMerchant, TReminder } from 'types'

// Outlining external interface of the data worker
export const dataWorkerMethods = {
  init: () => console.log('init'),
  // Initiate first data loading with token
  logIn: logInFx,

  /** Update data and then send */
  syncData: (token: string) => console.log('syncData', token),
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
}
