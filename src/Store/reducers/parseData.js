export default function parseData(state, res) {
  let newState = {
    lastSync: res.serverTimestamp
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
    if (res[type]) {
      res[type].forEach(el => {
        state[type][el.id] = el
      }) // not immutable, fix later
    }
  })
  return newState
}
