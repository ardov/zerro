import { createSlice } from 'redux-starter-kit'

// INITIAL STATE
const initialState = {
  serverTimestamp: 0,
  instrument: {},
  country: {},
  company: {},
  user: {},
  account: {},
  tag: {},
  budget: {},
  merchant: {},
  reminder: {},
  reminderMarker: {},
  transaction: {},
}

const { reducer, actions, selectors } = createSlice({
  slice: 'data',
  initialState,
  reducers: {
    wipeData: () => initialState,
    updateData: (state, action) => {
      const data = action.payload
      state.serverTimestamp = data.serverTimestamp
      for (let type in state) {
        if (data[type] && Array.isArray(data[type])) {
          data[type].forEach(item => {
            // budgets has no id field, so their id would be tag id + date
            const id = type === 'budget' ? `${item.tag},${item.date}` : item.id
            state[type][id] = item
          })
        }
      }
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { wipeData, updateData } = actions

// SELECTORS
export const { getData } = selectors
export const getLastSyncTime = state => state.data.serverTimestamp * 1000
