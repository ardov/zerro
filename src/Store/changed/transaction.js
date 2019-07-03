import { createSlice } from 'redux-starter-kit'
import { removeSynced } from './actions'

const { reducer, actions } = createSlice({
  slice: 'changed',
  initialState: {},
  reducers: {
    setTransaction: (state, { payload }) => {
      if (Array.isArray(payload)) {
        payload.forEach(tr => (state[tr.id] = tr))
      } else {
        state[payload.id] = payload
      }
    },
    removeTransaction: (state, { payload }) => {
      delete state[payload]
    },
  },
  extraReducers: {
    [removeSynced]: (state, { payload }) => {
      Object.keys(state).forEach(id => {
        if (state[id].changed < payload) {
          delete state[id]
        }
      })
    },
  },
})

export default reducer

// ACTIONS
export const { setTransaction, removeTransaction } = actions

// SELECTOR
export const getTransaction = (state, id) => state.dataToSync.transaction[id]
