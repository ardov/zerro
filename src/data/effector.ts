import { createEvent, createStore } from 'effector'
import { TDataStore, TDiff, TZmDiff } from 'types'
import { getBudgetId } from './converters/budget'
import { convertDiff } from './converters/diff'

// Events
const rawDataSynced = createEvent<TZmDiff>()
const dataSynced = rawDataSynced.map<TDiff>(convertDiff.toClient)
const resetData = createEvent()

// Store
const $serverData = createStore<TDataStore>(makeDataStore())

// Event bindings
$serverData.on(dataSynced, applyServerDiff)
$serverData.on(resetData, makeDataStore)

// HELPERS

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
