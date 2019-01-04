import parseDate from 'date-fns/parse'

export const parseData = res => state => {
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

export const populate = (
  el,
  {
    instrument,
    country,
    company,
    user,
    account,
    tag,
    budget,
    merchant,
    reminder,
    reminderMarker,
    transaction
  }
) => {
  const parsed = {}

  for (const key in el) {
    if (el[key]) {
      switch (key) {
        case 'changed':
        case 'paidTill':
        case 'created':
          parsed[key] = new Date(el[key])
          break

        case 'startDate':
        case 'endDate':
        case 'date':
          parsed[key] = parseDate(el[key])
          break

        case 'parent':
          if (typeof el[key] === 'string') {
            // this is Tag
            if (!tag[el[key]]) {
              // Tag not parsed yet
              tag[el[key]] = { id: el[key] }
            }
            parsed[key] = tag[el[key]]
          } else {
            // this is User
            if (!user[el[key]]) {
              // User not parsed yet
              user[el[key]] = {}
            }
            parsed[key] = user[el[key]]
          }
          break

        case 'currency':
        case 'instrument':
        case 'incomeInstrument':
        case 'outcomeInstrument':
        case 'opIncomeInstrument':
        case 'opOutcomeInstrument':
          parsed[key] = instrument[el[key]]
          break

        case 'country':
          parsed[key] = country[el[key]]
          break

        case 'user':
          parsed[key] = user[el[key]]
          break

        case 'company':
          parsed[key] = company[el[key]]
          break

        case 'incomeAccount':
        case 'outcomeAccount':
          parsed[key] = account[el[key]]
          break

        case 'tag':
          if (typeof el[key] === 'string') {
            parsed[key] = [tag[el[key]]]
          } else {
            parsed[key] = el[key].map(tagId => tag[tagId])
          }
          break

        case 'merchant':
          parsed[key] = merchant[el[key]]
          break

        case 'reminder':
          parsed[key] = reminder[el[key]]
          break

        case 'reminderMarker':
          parsed[key] = reminderMarker[el[key]]
          break

        default:
          break
      }
    }
  }

  if (el.hasOwnProperty('latitude')) {
    if (el.income && el.outcome) {
      parsed.type = 'transfer'
    } else {
      parsed.type = el.income ? 'income' : 'outcome'
    }
  }
  return { ...el, ...parsed }
}

export const check = ({
  search,
  type,
  showDeleted,
  fromDate,
  toDate,
  //
  tags,
  accounts,
  amountFrom,
  amountTo
}) => el => {
  const checkSearch = () => {
    if (!search) return true
    if (!el.comment) return false
    return el.comment.toUpperCase().includes(search.toUpperCase())
  }
  return (
    (type === 'any' || el.type === type) &&
    checkSearch() &&
    (showDeleted || !el.deleted) &&
    (!fromDate || +el.date >= +fromDate) &&
    (!toDate || +el.date <= +toDate)
  )
}

// {
//       search: null,
//       isIncome: true,
//       isOutcome: true,
//       isTransition: true,
//       deleted: false,
//       fromDate: null,
//       toDate: null,
//       tags: null,
//       accounts: null,
//       amountFrom: null,
//       amountTo: null
//     }
