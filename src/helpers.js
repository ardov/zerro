export const parseData = res => prevState => {
  function arrToObj(arr, obj) {
    if (arr && obj) {
      if (!obj.list) obj.list = []
      arr.forEach(el => {
        obj[el.id] = el
        if (!obj.list.includes(el.id)) obj.list.push(el.id)
      })
      return obj
    }
  }
  let newState = {}
  const toParse = [
    'instrument',
    'country',
    'company',
    'user',
    'account',
    'tag',
    'budget',
    'merchant',
    'reminder',
    'reminderMarker',
    'transaction'
  ]
  newState.lastSync = res.serverTimestamp
  toParse.forEach(i => {
    newState[i] = arrToObj(res[i], prevState[i])
  })

  return newState
}

export function saveState(state) {
  const keysToSave = [
    'lastSync',
    'instrument',
    'country',
    'company',
    'user',
    'account',
    'tag',
    'budget',
    'merchant',
    'reminder',
    'reminderMarker',
    'transaction',
    'token'
  ]

  keysToSave.forEach(key => {
    if (state[key]) {
      localStorage.setItem(key, JSON.stringify(state[key]))
    }
  })
}

export class Transaction {
  // {
  //   id: '8ECFEAB7-17F2-40F5-8B9B-279D2A136732',
  //   changed: 1488000309,
  //   created: 1488000309,
  //   user: 1,
  //   deleted: false,
  //   incomeInstrument: 2,
  //   incomeAccount: '0593FEF0-2618-45EB-B8DA-6BCF3B660177',
  //   income: 0,
  //   outcomeInstrument: 2,
  //   outcomeAccount: 'A85F1093-3886-4C99-823E-04E7202E5771',
  //   outcome: 2000,
  //   tag: null,
  //   merchant: '202EC174-9C9D-42FE-BD55-A5D4F38D5E76',
  //   payee: 'Паша',
  //   originalPayee: null,
  //   comment: 'Паша дал в долг до среды',
  //   date: '2017-03-20',
  //   mcc: null,
  //   reminderMarker: null,
  //   opIncome: null,
  //   opIncomeInstrument: null,
  //   opOutcome: null,
  //   opOutcomeInstrument: null,
  //   latitude: null,
  //   longitude: null
  // }
}
