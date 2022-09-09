// TODO: remove or start using

import { combine, createEvent, createStore } from 'effector'
import { TDataStore, TDiff } from '@shared/types'
import { immutableApplyDiff } from './shared/applyDiff'
import { immutableMergeDiffs } from './shared/mergeDiffs'
import { getItemsCount } from './shared/getItemsCount'
import { getLastDiffChange } from './shared/getLastDiffChange'

const applyServerPatch = createEvent<TDiff>('applyServerPatch')
const applyClientPatch = createEvent<TDiff>('applyClientPatch')
const resetData = createEvent<void>('resetData')

//
// Server store
const initialServerData: TDataStore = {
  serverTimestamp: 0,
  instrument: {},
  country: {},
  company: {},
  user: {},
  merchant: {},
  account: {},
  tag: {},
  budget: {},
  reminder: {},
  reminderMarker: {},
  transaction: {},
}

const $serverData = createStore(initialServerData)
  .on(applyServerPatch, (store, diff) => {
    if (!diff) return store
    return immutableApplyDiff(diff, store)
  })
  .on(resetData, () => initialServerData)

const $lastSyncTime = $serverData.map<number>(data => data.serverTimestamp)

//
// Diff store
const $diff = createStore<TDiff | null>(null)
  .on(applyClientPatch, (state, diff) => {
    if (!diff) return state
    return state ? immutableMergeDiffs(state, diff) : diff
  })
  .on(applyServerPatch, () => null)
  .on(resetData, () => null)

const $changedNum = $diff.map<number>(getItemsCount)

const $lastChange = $diff.map<number>(getLastDiffChange)

const $currentData = combine($serverData, $diff, (data, diff) => {
  if (!diff) return data
  return immutableApplyDiff(diff, data)
}).watch(s => console.log('$currentData', s))

export const dataModel = {
  applyServerPatch,
  applyClientPatch,
  resetData,

  $serverData,
  $diff,
  $currentData,

  $lastSyncTime,
  $shangedNum: $changedNum,
  $lastChange,
}
