import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TDataStore, IDiff } from '@shared/types'
import { applyDiff } from './shared/applyDiff'
import { mergeDiffs } from './shared/mergeDiffs'

interface DataSlice {
  current: TDataStore
  server?: TDataStore
  diff?: IDiff
}

const makeDataStore = (): TDataStore => ({
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
})

// INITIAL STATE
const initialState: DataSlice = {
  current: makeDataStore(),
  server: undefined,
  diff: undefined,
}

interface ExtendedDiff extends IDiff {
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
    applyClientPatch: (state, { payload }: PayloadAction<IDiff>) => {
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
