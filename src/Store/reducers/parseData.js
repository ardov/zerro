import keyBy from 'lodash/keyBy'

export default function parseData(state, response) {
  let newState = {
    lastSync: response.serverTimestamp
  }

  const types = [
    'instrument',
    'country',
    'company',
    'user',
    'account',
    'tag',
    // 'budget',
    'merchant',
    'reminder',
    'reminderMarker',
    'transaction'
  ]

  types.forEach(type => {
    if (response[type]) {
      newState[type] = {
        ...state[type],
        ...keyBy(response[type], el => el.id)
      }
    }
  })
  return { ...state, ...newState }
}
