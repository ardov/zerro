import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TDeletionObject } from 'models/deletion'
import { TDiff } from 'models/diff'
import { ById, TObjectClass } from 'shared/types'

type TSlice<T> = {
  server: ById<T>
  localDiff: ById<T>
  localDeletion?: TDeletionObject[]
}

interface ExtendedDiff extends TDiff {
  syncStartTime?: number
}

export function makeSlice<ObjType>(
  objType: TObjectClass,
  getId: (obj: ObjType) => string
) {
  const initialState: TSlice<ObjType> = {
    server: {},
    localDiff: {},
    localDeletion: undefined,
  }

  return createSlice({
    name: objType,
    initialState,
    reducers: {
      applyServerPatch: (state, { payload }: PayloadAction<ExtendedDiff>) => {
        if (!payload) return
        state.server ??= {}

        payload[objType]?.forEach(obj => {
          if ('id' in obj) {
            const id = obj.id
            // state.server[id] = obj
          }
        })

        // applyDiff(payload, state.server)
        // state.current = state.server
        // TODO: Тут хорошо бы не всё удалять, а только то что синхронизировалось (по времени старта). После этого надо ещё current пересобрать на основе серверных данных и диффа
        // state.localDiff = undefined
      },
      applyClientPatch: (state, { payload }: PayloadAction<TDiff>) => {
        // if (!payload) return
        // applyDiff(payload, state.current)
        // if (!state.diff) state.diff = { ...payload }
        // else mergeDiffs(state.diff, payload)
      },
      resetData: () => initialState,
    },
  })
}
