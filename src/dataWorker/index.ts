import { loadLocalDataFx, logInFx } from './effector'

// Outlining external interface of the data worker
export const dataWorkerMethods = {
  loadLocalData: loadLocalDataFx,
  init: () => console.log('init'),
  // Initiate first data loading with token
  logIn: logInFx,

  /** Update data and then send */
  syncData: (token: string) => console.log('syncData', token),
  applyPatch: () => console.log('applyPatch'),
  loadJSON: () => console.log('loadJSON'),
  reloadData: () => console.log('reloadData'),
  logOut: () => console.log('logOut'),

  // setMerchants: (merchants: TMerchant[]) =>
  //   console.log('setMerchants', merchants),
  // setReminders: (reminders: TReminder[]) =>
  //   console.log('setReminders', reminders),
  // setAccounts: (accounts: TAccount[]) => console.log('setAccounts', accounts),
}
