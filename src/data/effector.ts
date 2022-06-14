import { createDomain, forward, sample } from 'effector'
import { dataStorage } from 'services/storage'
import ZenApi from 'services/ZenApi'
import { TDataStore, TDiff, TToken, TZmDiff } from 'types'
import { getBudgetId } from './converters/budget'
import { convertDiff } from './converters/diff'

const workerData = createDomain('workerData')

// External events
export const syncInitiated = workerData.createEvent()
export const logInInitiated = workerData.createEvent<TToken>()
export const logOutInitiated = workerData.createEvent()

// Internal events
const dataSyncedRaw = workerData.createEvent<TZmDiff>()
const dataSynced = dataSyncedRaw.map<TDiff>(convertDiff.toClient)
const resetData = workerData.createEvent()
const tokenSet = workerData.createEvent<TToken>()

// Token store
const $token = workerData.store<TToken>(null)
$token.on(tokenSet, (_, token) => token)
$token.watch(token => dataStorage.set('token', token))

// Server data store
const $serverData = workerData.createStore<TDataStore>(makeDataStore())
$serverData
  .on(dataSynced, applyServerDiff)
  .on(resetData, makeDataStore)
  .watch(state => console.log('☄️ Data updated', state))

// Sync effect
const syncFx = workerData.createEffect(async (token: TToken) => {
  if (!token) throw new Error('No token provided')
  return ZenApi.getData(token)
})
syncFx.done.watch(({ result }) => dataSyncedRaw(result))

// Init effect
const initFx = workerData.createEffect(async () => {
  const token = await dataStorage.get('token')
  if (token) tokenSet(token)
})

// Log in effect
export const logInFx = workerData.createEffect(async (token: TToken) => {
  if (!token) throw new Error('No token provided')
  console.log('☄️ Log in')
  tokenSet(token)
  syncFx(token)
})
forward({ from: logInInitiated, to: logInFx })

sample({
  clock: syncInitiated,
  source: $token,
  target: syncFx,
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
      let id = getBudgetId(el)
      copy.budget[id] = el
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
      delete copy[el.object][el.id]
    })
  }
  return copy
}
