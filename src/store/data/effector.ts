// TODO: remove or start using

import { combine, createEvent, createStore } from 'effector'
import { TDataStore, IDiff } from '@shared/types'
import { immutableApplyDiff } from './shared/applyDiff'
import { immutableMergeDiffs } from './shared/mergeDiffs'

const applyServerPatch = createEvent<IDiff>('applyServerPatch')
const applyClientPatch = createEvent<IDiff>('applyClientPatch')
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
const $diff = createStore<IDiff | null>(null)
  .on(applyClientPatch, (state, diff) => {
    if (!diff) return state
    return state ? immutableMergeDiffs(state, diff) : diff
  })
  .on(applyServerPatch, () => null)
  .on(resetData, () => null)

const $shangedNum = $diff.map<number>(diff => {
  if (!diff) return 0
  return Object.values(diff).reduce((sum, arr) => sum + arr.length, 0)
})

const $lastChange = $diff.map<number>(diff => {
  if (!diff) return 0
  let lastChange = 0
  Object.values(diff).forEach(array =>
    array.forEach((item: { changed: number; [x: string]: any }) => {
      lastChange = Math.max(item.changed, lastChange)
    })
  )
  return lastChange
})

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
  $shangedNum,
  $lastChange,
}
