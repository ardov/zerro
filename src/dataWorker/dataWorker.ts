import { createEffect, createEvent, createStore, sample } from 'effector'
import { dataStorage } from 'services/storage'
import ZenApi from 'services/ZenApi'
import {
  ById,
  TAccount,
  TInstrument,
  TISOTimestamp,
  TMerchant,
  TReminder,
} from './types'

// Outlining external interface of the data worker
export const dataWorkerMethods = {
  logIn: (token: string) => console.log('logIn', token),
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

type TToken = string
const $token = createStore<TToken | null>(null)
const setToken = createEvent<TToken>()
const saveTokenLocallyFx = createEffect<TToken | null, void>(async token => {
  await dataStorage.set('token', token)
  console.log('💾 token saved', token)
})

type TServerData = {
  serverTimestamp: TISOTimestamp
  instruments: ById<TInstrument>
}
const initialServerData: TServerData = { serverTimestamp: '', instruments: {} }
const $serverData = createStore<TServerData>(initialServerData)

const syncDataFx = createEffect(
  async (token: TToken, serverData: TServerData) => {
    ZenApi.getData(token)
  }
)

const logInFx = createEffect(async (token: TToken) => {
  await dataStorage.set('token', token)
})

$token.on(setToken, token => token)
$token.watch(saveTokenLocallyFx)

sample({
  source: { token: $token, serverData: $serverData },
  clock: logInFx,
  fn: ({ token, serverData }) => token,
})
