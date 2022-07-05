import { createDomain, forward, sample } from 'effector'
import { convertDiff } from 'models/diff'
import { zenmoney } from 'shared/api/zenmoney'
import { TDataStore, TDiff, TToken, TZmDiff } from 'shared/types'

import { clearStorage, getLocalData, setLocalKey } from './storageMethods'

const workerData = createDomain('workerData')

// External events
export const initTriggered = workerData.createEvent()
export const syncTriggered = workerData.createEvent<TDiff>()
export const loggedIn = workerData.createEvent<TToken>()
export const logOutTriggered = workerData.createEvent()

// Internal events
const dataSyncedRaw = workerData.createEvent<TZmDiff>()
const dataSynced = dataSyncedRaw.map<TDiff>(convertDiff.toClient)
const resetData = workerData.createEvent()
const tokenSet = workerData.createEvent<TToken>()

// Token store
const $token = workerData.store<TToken>(null)
$token.on(tokenSet, (_, token) => token)
$token.watch(token => setLocalKey('token', token))

// Server data store
const $serverData = workerData.createStore<TDataStore>(makeDataStore())
$serverData
  .on(dataSynced, applyServerDiff)
  .on(resetData, makeDataStore)
  .watch(state => console.log('☄️ Data updated', state))

// Derivative stores
const $serverTimestamp = $serverData.map(state => state.serverTimestamp)
const $instrument = $serverData.map(d => d.instrument)
const $country = $serverData.map(d => d.country)
const $company = $serverData.map(d => d.company)
const $user = $serverData.map(d => d.user)
const $account = $serverData.map(d => d.account)
const $merchant = $serverData.map(d => d.merchant)
const $tag = $serverData.map(d => d.tag)
const $budget = $serverData.map(d => d.budget)
const $reminder = $serverData.map(d => d.reminder)
const $reminderMarker = $serverData.map(d => d.reminderMarker)
const $transaction = $serverData.map(d => d.transaction)

/**
 * Sync effect
 */
export const syncFx = workerData.createEffect(
  async (props: { token: TToken; diff?: TDiff }) => {
    const { token, diff } = props

    try {
      if (!token) return { error: 'No token' }
      let zmDiff = diff && convertDiff.toServer(diff)
      let data = await zenmoney.getData(token, zmDiff)
      dataSyncedRaw(data)
      return { data: convertDiff.toClient(data) }
    } catch (error: any) {
      return { error: error.message as string }
    }
  }
)

/**
 * Log in effect
 */
const logInFx = workerData.createEffect(async (token: TToken) => {
  if (!token) throw new Error('No token provided')
  console.log('☄️ Log in')
  tokenSet(token)
  syncFx({ token })
})
forward({ from: loggedIn, to: logInFx })

/**
 * Load data from indexedDB
 */
export const getLocalDataFx = workerData.createEffect(async () => {
  console.log('☄️ Get local data')
  const { token, ...data } = await getLocalData()
  tokenSet(token || null)
  dataSyncedRaw(data)
  return convertDiff.toClient(data)
})

/**
 * Clear storage effect
 */
const clearStorageFx = workerData.createEffect(async () => {
  console.log('☄️ Clear storage')
  return clearStorage()
})

/**
 * Save data locally effect
 */
// const saveDataLocally = workerData.createEffect(async (dataToSave: TZmDiff) => {
//   keys(dataToSave).forEach(key => {
//     setLocalKey(key, dataToSave[key])
//   })
// })

// LOGIC

// Sync when syncTriggered
sample({
  clock: syncTriggered,
  source: $token,
  fn: (token, diff) => ({ token, diff }),
  target: syncFx,
})

// Fire dataSyncedRaw when syncFx is done
// sample({
//   clock: syncFx.done,
//   fn: syncResult => syncResult.result,
//   target: dataSyncedRaw,
// })

sample({
  clock: logOutTriggered,
  target: [clearStorageFx, resetData],
})

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

/** Returns initial store state */
function makeDataStore(): TDataStore {
  return {
    serverTimestamp: 0,
    instrument: {},
    user: {},
    merchant: {},
    country: {},
    company: {},
    reminder: {},
    reminderMarker: {},
    account: {},
    tag: {},
    budget: {},
    transaction: {},
  }
}

/**
 * Reducer to apply already prepared server diff to local store
 * @param state
 * @param diff
 * @returns state
 */
function applyServerDiff(state: TDataStore, diff: TDiff): TDataStore {
  if (!diff || !diff.serverTimestamp) return state
  if (state.serverTimestamp > diff.serverTimestamp) return state
  let copy = { ...state }
  if (diff.serverTimestamp) {
    copy.serverTimestamp = diff.serverTimestamp
  }
  if (diff.instrument) {
    copy.instrument = { ...copy.instrument }
    diff.instrument.forEach(el => {
      copy.instrument[el.id] = el
    })
  }
  if (diff.user) {
    copy.user = { ...copy.user }
    diff.user.forEach(el => {
      copy.user[el.id] = el
    })
  }
  if (diff.merchant) {
    copy.merchant = { ...copy.merchant }
    diff.merchant.forEach(el => {
      copy.merchant[el.id] = el
    })
  }
  if (diff.country) {
    copy.country = { ...copy.country }
    diff.country.forEach(el => {
      copy.country[el.id] = el
    })
  }
  if (diff.company) {
    copy.company = { ...copy.company }
    diff.company.forEach(el => {
      copy.company[el.id] = el
    })
  }
  if (diff.reminder) {
    copy.reminder = { ...copy.reminder }
    diff.reminder.forEach(el => {
      copy.reminder[el.id] = el
    })
  }
  if (diff.reminderMarker) {
    copy.reminderMarker = { ...copy.reminderMarker }
    diff.reminderMarker.forEach(el => {
      copy.reminderMarker[el.id] = el
    })
  }
  if (diff.account) {
    copy.account = { ...copy.account }
    diff.account.forEach(el => {
      copy.account[el.id] = el
    })
  }
  if (diff.tag) {
    copy.tag = { ...copy.tag }
    diff.tag.forEach(el => {
      copy.tag[el.id] = el
    })
  }
  if (diff.budget) {
    copy.budget = { ...copy.budget }
    diff.budget.forEach(el => {
      copy.budget[el.id] = el
    })
  }
  if (diff.transaction) {
    copy.transaction = { ...copy.transaction }
    diff.transaction.forEach(el => {
      copy.transaction[el.id] = el
    })
  }
  if (diff.deletion) {
    diff.deletion.forEach(el => {
      // @ts-ignore
      copy[el.object] = { ...copy[el.object] }
      // @ts-ignore
      delete copy[el.object][el.id]
    })
  }
  return copy
}
