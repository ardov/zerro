import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { DataStore, Diff } from 'types'
import { applyDiff } from './applyDiff'
import { mergeDiffs } from './mergeDiffs'

interface DataSlice {
  current: DataStore
  server?: DataStore
  diff?: Diff
}

const makeDataStore = (): DataStore => ({
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
})

// INITIAL STATE
const initialState: DataSlice = {
  current: makeDataStore(),
  server: undefined,
  diff: undefined,
}

interface ExtendedDiff extends Diff {
  syncStartTime?: number
}

// SLICE
const { reducer, actions } = createSlice({
  name: 'data',
  initialState,
  reducers: {
    applyServerPatch: (state, { payload }: PayloadAction<ExtendedDiff>) => {
      if (!payload) return
      state.server ??= makeDataStore()
      applyDiff(payload, state.server)
      state.current = state.server
      // TODO: Тут хорошо бы не всё удалять, а только то что синхронизировалось (по времени старта). После этого надо ещё current пересобрать на основе серверных данных и диффа
      state.diff = undefined
    },
    applyClientPatch: (state, { payload }: PayloadAction<Diff>) => {
      if (!payload) return
      applyDiff(payload, state.current)
      if (!state.diff) state.diff = { ...payload }
      else mergeDiffs(state.diff, payload)
    },
    resetData: () => initialState,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { applyServerPatch, applyClientPatch, resetData } = actions

// SELECTORS
export const getDiff = (state: RootState) => state.data.diff
