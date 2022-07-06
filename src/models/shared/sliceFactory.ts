// Experimentsl function to create separate slices
// TODO: use or remove

import { createAction, createSlice } from '@reduxjs/toolkit'
import {
  DataEntity,
  IAccount,
  IBudget,
  ICompany,
  ICountry,
  IDiff,
  IInstrument,
  IMerchant,
  IReminder,
  IReminderMarker,
  ITag,
  IUser,
} from 'shared/types'

const applyServerPatch = createAction<IDiff>('data/applyServerPatch')
const applyClientPatch = createAction<IDiff>('data/applyClientPatch')

export function makeDataSlice<
  Obj extends
    | IInstrument
    | ICountry
    | ICompany
    | IUser
    | IMerchant
    | IAccount
    | IBudget
    | ITag
    | IReminder
    | IReminderMarker
>(name: DataEntity) {
  type Id = Obj['id']

  type Slice = {
    server?: Record<Id, Obj>
    local?: Record<Id, Obj>
    deletion: Id[]
  }

  const initialState: Slice = {
    server: {} as Record<Id, Obj>,
    local: {} as Record<Id, Obj>,
    deletion: [] as Id[],
  }

  return createSlice({
    name: `data/${name}`,
    initialState,
    reducers: {},
    extraReducers: builder => {
      // Apply server patch
      builder.addCase(applyServerPatch, (state, { payload }) => {
        if (!payload) return
        const s = state as Slice
        s.server ??= {} as Record<Id, Obj>
        ;(payload[name] as Obj[])?.forEach(obj => {
          s.server && (s.server[obj.id as Id] = obj)
        })
        payload.deletion?.forEach(deletion => {
          if (deletion.object === name) {
            let id = deletion.id as Id
            s.server && delete s.server[id]
          }
        })
        // TODO: Тут хорошо бы не всё удалять, а только то что синхронизировалось (по времени старта)
        s.local = undefined
      })

      // Apply client patch
      builder.addCase(applyClientPatch, (state, { payload }) => {
        if (!payload) return
        const s = state as Slice
        s.local ??= {} as Record<Id, Obj>
        ;(payload[name] as Obj[])?.forEach(obj => {
          s.local && (s.local[obj.id as Id] = obj)
        })
        payload.deletion?.forEach(deletion => {
          if (deletion.object === name) {
            s.deletion.push(deletion.id as Id)
          }
        })
      })
    },
  })
}
